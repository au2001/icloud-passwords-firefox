import { Link } from "react-router-dom";
import styles from "./header.module.scss";

interface Props {
  sticky?: boolean;
  actionLabel?: string;
  actionLink?: string;
  action?: () => void;
}

export function Header({
  sticky = false,
  actionLabel,
  actionLink,
  action,
}: Props) {
  return (
    <header className={`${styles.header} ${sticky ? styles.sticky : ""}`}>
      <img src="/images/PasswordsExtensionIcon_32.png" alt="" />
      <h1>iCloud Passwords</h1>

      {actionLabel !== undefined && (
        <Link
          to={actionLink ?? "#"}
          onClick={
            action !== undefined
              ? (e) => {
                  e.preventDefault();
                  action?.();
                }
              : undefined
          }
        >
          {actionLabel}
        </Link>
      )}
    </header>
  );
}
