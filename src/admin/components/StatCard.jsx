function StatCard({
  title,
  value,
}) {
  return (
    <div className="card">
      <p className="text-small">
        {title}
      </p>

      <h2
        className="
          text-heading

          mt-2
        "
      >
        {value}
      </h2>
    </div>
  );
}

export default StatCard;