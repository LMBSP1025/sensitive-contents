// sensitive.contents/src/app/_components/date-formatter.tsx
import { parseISO, format, isValid } from "date-fns";

type Props = {
  dateString: string;
};

const DateFormatter = ({ dateString }: Props) => {
  let date;
  try {
    date = parseISO(dateString);
    if (!isValid(date)) {
      throw new Error("Invalid date string");
    }
  } catch (error) {
    console.error("Invalid date string:", error);
    return <time dateTime={dateString}>Invalid Date</time>;
  }

  return <time dateTime={dateString}>{format(date, "LLLL d, yyyy")}</time>;
};

export default DateFormatter;