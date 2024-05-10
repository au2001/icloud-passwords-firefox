import styles from "./one-time-codes.module.scss";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useEffect } from "react";
import { HomeContext } from "./home";

export function OneTimeCodesView() {
  const navigate = useNavigate();
  const { oneTimeCodes } = useOutletContext<HomeContext>();

  const hasOneTimeCode = oneTimeCodes.length !== 0;

  useEffect(() => {
    if (hasOneTimeCode) return;
    navigate("/");
  }, [hasOneTimeCode]);

  return (
    <div className={styles.oneTimeCodes}>
      {oneTimeCodes.length > 0 ? (
        <>
          <h2>Select a verification code to use:</h2>

          <ul>
            {oneTimeCodes.map((oneTimeCode, i) => (
              <li
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  // TODO
                }}
              >
                <div>
                  <span>{oneTimeCode.username}</span>
                  <span>{oneTimeCode.domain}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>
          <br />
          No one time codes saved on this website.
          <br />
          <br />
        </p>
      )}
    </div>
  );
}
