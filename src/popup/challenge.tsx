import React from "react";
import browser from "webextension-polyfill";

interface Props {
  setReady: () => void;
}

export function ChallengeView({ setReady }: Props) {
  const [pake, setPAKE] = React.useState<object>();
  const [pin, setPin] = React.useState("");

  React.useEffect(() => {
    browser.runtime
      .sendMessage({
        cmd: "REQUEST_CHALLENGE_PIN",
      })
      .then(setPAKE);
  }, []);

  const handleChangePin = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (pake === undefined) return;

    const result = await browser.runtime.sendMessage({
      cmd: "SET_CHALLENGE_PIN",
      pake,
      pin,
    });

    if (result !== true) throw result;

    setReady();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="number" value={pin} onChange={handleChangePin} />
      <input type="submit" value="Submit" />
    </form>
  );
}
