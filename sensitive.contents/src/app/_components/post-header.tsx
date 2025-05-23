import Avatar from "./avatar";
import CoverImage from "./cover-image";
import DateFormatter from "./date-formatter";
import { PostTitle } from "@/app/_components/post-title";
import { type Author } from "@/interfaces/author";

type Props = {
  title: string;
  coverImage: string;
  date: string;
  showCoverImage?: boolean;
};

export function PostHeader({ title, coverImage, date, showCoverImage = true }: Props) {
  return (
    <>
      <PostTitle>{title}</PostTitle>
      {coverImage && showCoverImage && (
        <div className="mb-8 md:mb-16 sm:mx-0">
          <CoverImage title={title} src={coverImage} />
        </div>
      )}
      <div className="mx-auto">
        <div className="mb-6 text-lg">
        </div>
      </div>
    </>
  );
}
