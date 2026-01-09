import { open } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";

interface FileFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dialogTitle?: string;
  filterExtensions?: string[];
  directory?: boolean;
}

export function FileField(props: FileFieldProps) {
  const {
    label,
    value,
    onChange,
    placeholder,
    dialogTitle,
    filterExtensions,
    directory,
  } = props;

  const handleBrowse = useCallback(async () => {
    const selected = await open({
      title: dialogTitle ?? label,
      multiple: false,
      directory: directory === true,
      filters: directory
        ? undefined
        : filterExtensions && filterExtensions.length > 0
          ? [{ name: label, extensions: filterExtensions }]
          : undefined,
    });

    if (typeof selected === "string") {
      onChange(selected);
    }
  }, [dialogTitle, filterExtensions, label, onChange]);

  return (
    <label>
      <span>{label}</span>
      <div className="file-field__input">
        <input
          value={value}
          placeholder={placeholder ?? "Select a file"}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" className="secondary" onClick={handleBrowse}>
          Browse
        </button>
      </div>
    </label>
  );
}
