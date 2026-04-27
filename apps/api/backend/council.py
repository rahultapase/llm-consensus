"""3-stage LLM Council orchestration."""

import re
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

from .openrouter import query_model, query_models_parallel


async def stage1_collect_responses(
    user_query: str,
    council_models: List[str],
    model_params: Optional[Dict[str, Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """Stage 1: Collect individual responses from all council models."""
    messages = [{"role": "user", "content": user_query}]
    responses = await query_models_parallel(council_models, messages, model_params=model_params)

    stage1_results = []
    for model, response in responses.items():
        if response is not None:
            stage1_results.append({
                "model": model,
                "response": response.get("content", ""),
            })

    return stage1_results


async def stage2_collect_rankings(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    council_models: List[str],
    model_params: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    """Stage 2: Each model ranks the anonymized responses."""
    labels = [chr(65 + i) for i in range(len(stage1_results))]

    label_to_model = {
        f"Response {label}": result["model"]
        for label, result in zip(labels, stage1_results)
    }

    responses_text = "\n\n".join([
        f"Response {label}:\n{result['response']}"
        for label, result in zip(labels, stage1_results)
    ])

    ranking_prompt = f"""You are evaluating different responses to the following question:

Question: {user_query}

Here are the responses from different models (anonymized):

{responses_text}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response A provides good detail on X but misses Y...
Response B is accurate but lacks depth on Z...
Response C offers the most comprehensive answer...

FINAL RANKING:
1. Response C
2. Response A
3. Response B

Now provide your evaluation and ranking:"""

    messages = [{"role": "user", "content": ranking_prompt}]
    responses = await query_models_parallel(council_models, messages, model_params=model_params)

    stage2_results = []
    for model, response in responses.items():
        if response is not None:
            full_text = response.get("content", "")
            parsed = parse_ranking_from_text(full_text)
            stage2_results.append({
                "model": model,
                "ranking": full_text,
                "parsed_ranking": parsed,
            })

    return stage2_results, label_to_model


async def stage3_synthesize_final(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    stage2_results: List[Dict[str, Any]],
    chairman_model: str,
) -> Dict[str, Any]:
    """Stage 3: Chairman synthesizes final response."""
    stage1_text = "\n\n".join([
        f"Model: {result['model']}\nResponse: {result['response']}"
        for result in stage1_results
    ])

    stage2_text = "\n\n".join([
        f"Model: {result['model']}\nRanking: {result['ranking']}"
        for result in stage2_results
    ])

    chairman_prompt = f"""You are the Chairman of an LLM Council. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

Original Question: {user_query}

STAGE 1 - Individual Responses:
{stage1_text}

STAGE 2 - Peer Rankings:
{stage2_text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's original question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:"""

    messages = [{"role": "user", "content": chairman_prompt}]
    response = await query_model(chairman_model, messages)

    if response is None:
        return {
            "model": chairman_model,
            "response": "Error: Unable to generate final synthesis.",
        }

    return {
        "model": chairman_model,
        "response": response.get("content", ""),
    }


def parse_ranking_from_text(ranking_text: str) -> List[str]:
    """Parse the FINAL RANKING section from the model's response."""
    if "FINAL RANKING:" in ranking_text:
        parts = ranking_text.split("FINAL RANKING:")
        if len(parts) >= 2:
            ranking_section = parts[1]
            numbered_matches = re.findall(r"\d+\.\s*Response [A-Z]", ranking_section)
            if numbered_matches:
                return [re.search(r"Response [A-Z]", m).group() for m in numbered_matches]

            matches = re.findall(r"Response [A-Z]", ranking_section)
            return matches

    matches = re.findall(r"Response [A-Z]", ranking_text)
    return matches


def calculate_aggregate_rankings(
    stage2_results: List[Dict[str, Any]],
    label_to_model: Dict[str, str],
) -> List[Dict[str, Any]]:
    """Calculate aggregate rankings across all models."""
    model_positions: Dict[str, List[int]] = defaultdict(list)

    for ranking in stage2_results:
        parsed_ranking = parse_ranking_from_text(ranking["ranking"])

        for position, label in enumerate(parsed_ranking, start=1):
            if label in label_to_model:
                model_name = label_to_model[label]
                model_positions[model_name].append(position)

    aggregate = []
    for model, positions in model_positions.items():
        if positions:
            avg_rank = sum(positions) / len(positions)
            aggregate.append({
                "model": model,
                "average_rank": round(avg_rank, 2),
                "rankings_count": len(positions),
            })

    aggregate.sort(key=lambda x: x["average_rank"])
    return aggregate


async def generate_conversation_title(user_query: str) -> str:
    """Generate a short title for a conversation."""
    import random
    style_hints = [
        "Use a noun phrase.",
        "Start with a verb.",
        "Use an adjective before the main noun.",
        "Frame it as a topic, not a question.",
        "Keep it action-oriented.",
        "Use a different angle or emphasis than the obvious one.",
    ]
    style = random.choice(style_hints)
    title_prompt = f"""Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.
Style hint: {style}

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]
    response = await query_model("google/gemini-2.5-flash", messages, timeout=30.0)

    if response is None:
        return "New Conversation"

    title = response.get("content", "New Conversation").strip().strip("\"'")
    if len(title) > 50:
        title = title[:47] + "..."
    return title
