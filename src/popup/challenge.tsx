import React from "react";
import browser from "webextension-polyfill";

export function ChallengeView() {
  const [pake, setPAKE] = React.useState<object>();
  const [pin, setPin] = React.useState("");

  const requestChallengePin = async () => {
    setPAKE(
      await browser.runtime.sendMessage({
        cmd: "REQUEST_CHALLENGE_PIN",
      }),
    );
  };

  React.useEffect(() => {
    requestChallengePin();
  }, []);

  const handleChangePin = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (pake === undefined) return;

    await browser.runtime.sendMessage({
      cmd: "SET_CHALLENGE_PIN",
      pake,
      pin,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="number" value={pin} onChange={handleChangePin} />
      <input type="submit" value="Submit" />
    </form>
  );
}
