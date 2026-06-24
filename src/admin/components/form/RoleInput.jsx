import { useState } from "react";
import { X } from "lucide-react";

function RoleInput({
  roles,
  setRoles,
}) {
  const [value, setValue] =
    useState("");

  const addRole = () => {
    const role = value.trim();

    if (!role) return;

    if (roles.includes(role)) return;

    setRoles([...roles, role]);

    setValue("");
  };

  const removeRole = (role) => {
    setRoles(
      roles.filter((r) => r !== role),
    );
  };

  return (
    <div className="space-y-4">
      <label className="text-label">
        Roles
      </label>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) =>
            setValue(e.target.value)
          }
          placeholder="Add role"
          className="
            flex-1

            h-control

            px-control

            rounded-control

            bg-surface

            border
            border-border
          "
        />

        <button
          type="button"
          onClick={addRole}
          className="
            px-5

            rounded-control

            bg-primary

            text-background
          "
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <div
            key={role}
            className="
              flex
              items-center
              gap-2

              px-4
              py-2

              rounded-full

              bg-surface

              border
              border-border
            "
          >
            <span>{role}</span>

            <button
              onClick={() =>
                removeRole(role)
              }
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoleInput;