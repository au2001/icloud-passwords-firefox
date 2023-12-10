import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { ErrorView } from "./error";
import styles from "./generator.module.scss";

export function GeneratorView() {
  const input = useRef<HTMLInputElement | null>(null);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState<boolean>();
  const [error, setError] = useState<string>();

  useLayoutEffect(() => {
    if (password !== "") return;

    const NUMBERS = "0123456789";
    const UPPERCASE = "ABCDEFGHJKLMNOPQRSTUVWXYZ"; // Excludes I
    const LOWERCASE = "abcdefghijkmnopqrstuvwxyz"; // Excludes l
    const SEPARATOR = "-";

    const getRandomNumber = (n: number) => {
      const RAND_MAX = Math.pow(2, 32);
      if (n <= 0 || n > RAND_MAX) throw `RANDOM_OUT_OF_RANGE:${n}`;

      const array = new Uint32Array(1);
      do {
        crypto.getRandomValues(array);
        // Prevent modulo bias
      } while (array[0] >= RAND_MAX - (RAND_MAX % n));

      return array[0] % n;
    };

    // Generate 16 lowercase letters
    const output = [];
    while (output.length < 16)
      output.push(LOWERCASE.charAt(getRandomNumber(LOWERCASE.length)));

    // Insert one number placed randomly
    output.splice(
      getRandomNumber(output.length),
      0,
      NUMBERS.charAt(getRandomNumber(NUMBERS.length)),
    );

    // Insert one uppercase letter placed randomly
    output.splice(
      getRandomNumber(output.length),
      0,
      UPPERCASE.charAt(getRandomNumber(UPPERCASE.length)),
    );

    // Add dashes every 6 characters
    const parts = [
      output.slice(0, 6).join(""),
      output.slice(6, 12).join(""),
      output.slice(12, 18).join(""),
    ];

    setPassword(parts.join(SEPARATOR));
  }, [password]);

  useEffect(() => {
    switch (copied) {
      case false:
        // Just copied, reset the timeout
        setCopied(true);
        break;

      case true:
        // Wait for timeout to reset state
        const timeout = setTimeout(() => setCopied(undefined), 1000);
        return () => clearTimeout(timeout);

      default:
        // Not copied, nothing to do
        break;
    }
  }, [copied]);

  const handleSelect = useCallback(() => {
    input.current?.select();
    input.current?.setSelectionRange(0, input.current.value.length);
  }, [input.current]);

  useEffect(() => {
    handleSelect();
  }, [handleSelect]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(false);
    } catch (e: any) {
      setError(e);
    }
  };

  if (error !== undefined) return <ErrorView error={error} />;

  return (
    <div className={styles.generator}>
      <header>
        <img src="/images/PasswordsExtensionIcon_32.png" alt="" />
        <h1>iCloud Passwords</h1>
        <Link to="/">Back</Link>
      </header>

      <div>
        <h2>Create a strong password:</h2>

        <input
          type="text"
          value={password}
          autoFocus
          readOnly
          onClick={handleSelect}
          ref={input}
        />

        <div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopy();
            }}
          >
            {copied === undefined ? "Copy" : "Copied!"}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPassword("");
            }}
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
