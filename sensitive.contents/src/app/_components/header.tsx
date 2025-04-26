import Link from "next/link";

const Header = () => {
  return (
    <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tighter mb-10 mt-7 flex items-center">
      <Link href="/" className="hover:underline" style={{
        filter: 'invert(100%)',
        mixBlendMode: 'difference',
        zIndex:'500',
        color:'white',
        }}>
        sensitive.contents.
      </Link>
    </h2>
  );
};

export default Header;
