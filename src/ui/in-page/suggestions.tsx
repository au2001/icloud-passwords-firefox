import { useMemo } from "react";
import { useLoginNames } from "../shared/hooks/use-login-names";
import { KeyIcon } from "../shared/icons/key";
import styles from "./suggestions.module.scss";

interface Props {
  tabId: number;
  url: string;
  isPassword: boolean;
  query: string;
}

export function SuggestionsView({ tabId, url, isPassword, query }: Props) {
  isPassword;
  query;

  const { loginNames, error } = useLoginNames(tabId, url);

  const matchingLoginNames = useMemo(
    () =>
      loginNames?.filter((loginName) => loginName.username.startsWith(query)),
    [loginNames, query],
  );

  if (error !== undefined) return <p>Error: {error}</p>;
  if (matchingLoginNames === undefined) return <p>Loading...</p>;

  return (
    <div className={styles.suggestions}>
      {matchingLoginNames.length > 0 ? (
        <ul>
          {matchingLoginNames.map((loginName, i) => (
            <li
              key={i}
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              <KeyIcon title="Password item" />
              <div>
                <span>{loginName.username}</span>
                <span>{loginName.sites[0] ?? ""}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {query === "" ? (
            <>No passwords saved on this website.</>
          ) : (
            <>No matching passwords found for this website.</>
          )}
        </p>
      )}
    </div>
  );
}
