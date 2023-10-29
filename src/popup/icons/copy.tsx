interface Props {
  title?: string;
  desc?: string;
}

export function CopyIcon({
  title,
  desc,
  ...props
}: Props & React.SVGAttributes<SVGSVGElement>) {
  const uuid = crypto.randomUUID().replace(/-/g, "");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      aria-labelledby={`${uuid}_title ${uuid}_desc`}
      role="img"
      {...props}
    >
      <title id={uuid}>{title}</title>
      <desc id={uuid}>{desc}</desc>
      <path
        d="M2.41667 6.33333V13C2.41667 13.598 2.90201 14.0833 3.50001 14.0833H8.83334C9.43134 14.0833 9.91667 13.598 9.91667 13V6.33333C9.91667 5.73533 9.43134 5.25 8.83334 5.25H3.50001C2.90201 5.25 2.41667 5.73533 2.41667 6.33333Z"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linejoin="round"
      />
      <path
        d="M11.5 11.4167C12.098 11.4167 12.5833 10.9313 12.5833 10.3333V3.66667C12.5833 3.06867 12.098 2.58333 11.5 2.58333H6.16666C5.56866 2.58333 5.08333 3.06867 5.08333 3.66667"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linejoin="round"
      />
    </svg>
  );
}
