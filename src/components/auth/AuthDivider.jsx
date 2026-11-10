function AuthDivider({ text = "or continue with" }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-muted" role="separator">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
      {text}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

export default AuthDivider;
