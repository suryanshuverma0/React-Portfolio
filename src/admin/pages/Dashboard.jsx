function Dashboard() {
  const stats = [
    {
      label: "Projects",
      value: 8,
    },
    {
      label: "Skills",
      value: 15,
    },
    {
      label: "Certificates",
      value: 4,
    },
    {
      label: "Views",
      value: "1.2K",
    },
  ];

  return (
    <div
      className="
        max-w-6xl

        mx-auto

        w-full

        space-y-10
      "
    >
      {/* Hero */}

      <section>
        <h1 className="text-heading">
          Dashboard
        </h1>

        <p
          className="
            text-body

            mt-3
          "
        >
          Manage your portfolio content,
          projects, certificates and skills.
        </p>
      </section>

      {/* Stats */}

      <section
        className="
          grid

          gap-4

          sm:grid-cols-2

          xl:grid-cols-4
        "
      >
        {stats.map((item) => (
          <div
            key={item.label}
            className="
              card

              glass-hover
            "
          >
            <p className="text-small">
              {item.label}
            </p>

            <h2
              className="
                text-heading

                mt-4
              "
            >
              {item.value}
            </h2>
          </div>
        ))}
      </section>

      {/* Recent Activity */}

      <section
        className="
          card

          space-y-4
        "
      >
        <div>
          <h2 className="text-title">
            Recent Activity
          </h2>

          <p
            className="
              text-small

              mt-2
            "
          >
            Latest changes across your
            portfolio.
          </p>
        </div>

        <div
          className="
            py-8

            text-center
          "
        >
          <p className="text-body">
            No recent activity yet.
          </p>
        </div>
      </section>

      {/* Quick Actions */}

      <section
        className="
          grid

          gap-4

          md:grid-cols-3
        "
      >
        <button
          className="
            card

            text-left

            glass-hover
          "
        >
          <h3 className="text-label">
            Update Profile
          </h3>

          <p
            className="
              text-small

              mt-2
            "
          >
            Manage personal information.
          </p>
        </button>

        <button
          className="
            card

            text-left

            glass-hover
          "
        >
          <h3 className="text-label">
            Add Project
          </h3>

          <p
            className="
              text-small

              mt-2
            "
          >
            Publish a new project.
          </p>
        </button>

        <button
          className="
            card

            text-left

            glass-hover
          "
        >
          <h3 className="text-label">
            Add Certificate
          </h3>

          <p
            className="
              text-small

              mt-2
            "
          >
            Showcase achievements.
          </p>
        </button>
      </section>
    </div>
  );
}

export default Dashboard;