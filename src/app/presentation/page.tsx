import Presentation from "@/components/Presentation/presentation";
import { Suspense } from "react";

const Page = () => (
  <Suspense>
    <Presentation />
  </Suspense>
);

export default Page;
