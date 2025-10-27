import Viewer from "./viewer";

export default function CountryPage({ params }: { params: { iso2: string } }) {
  const code = (params.iso2 ?? "").toLowerCase();
  return <Viewer code={code} />;
}
