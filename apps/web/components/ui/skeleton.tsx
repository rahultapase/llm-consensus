import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("shimmer-line rounded", className)}
      style={style}
      aria-hidden="true"
    />
  );
}
