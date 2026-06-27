type Props = {
  label?: string;
};

export default function Loading({ label }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center gap-1 px-0.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 rounded-full bg-gray-400/70 animate-typing-dot"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      {label && (
        <span className="text-[12px] text-gray-400 tracking-wide">{label}</span>
      )}
    </div>
  );
}
