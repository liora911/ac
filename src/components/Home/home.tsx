import Image from "next/image";
import React from "react";
import { FaFacebook, FaYoutube } from "react-icons/fa";

const Home = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 md:p-24 bg-gray-50 text-gray-800">
      <div className="text-center max-w-3xl w-full bg-white shadow-xl rounded-lg p-6 sm:p-8 md:p-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-700">
          Avshalom C. Elitzur
        </h1>
        <h2 className="text-2xl sm:text-3xl mt-2 text-blue-600">
          אבשלום אליצור
        </h2>
        <p className="text-lg sm:text-xl mt-2 text-gray-700">
          אֲתַר דִי בֵהּ יֶחֱדוּן רוּחִין וְנַפְשִׁין
        </p>
        <p className="text-lg sm:text-xl mt-1 text-gray-600">
          A Site where Souls and Minds Rejoice
        </p>

        <div className="my-6 sm:my-8">
          <Image
            src="/acpfp2.png"
            alt="Avshalom C. Elitzur"
            width={150}
            height={150}
            className="mx-auto rounded-full border-4 border-blue-300 shadow-md"
          />
          <p className="text-xs sm:text-sm mt-2 text-gray-500">
            Photo: Avishag Shaar Yashuv
          </p>
        </div>

        <p className="text-md sm:text-lg mt-4">
          Shalom and welcome to my site.
        </p>

        <div className="mt-4 text-left text-sm sm:text-base space-y-3">
          <p>
            My research topics are diverse, spanning over quantum mechanics,
            relativity, thermodynamics, evolutionary biology, psychoanalysis and
            philosophy of mind.
          </p>
          <p>
            All articles and presentations posted on this site are Copyleft.
            Most of my peer-reviewed papers can be downloaded. Help yourself
            with the presentations as well.
          </p>
          <p>Comments are welcome.</p>
        </div>

        <p className="text-md sm:text-lg mt-6 sm:mt-8">שלום וברוכים הבאים.</p>
        <p
          className="mt-3 text-right text-sm sm:text-base max-w-2xl mx-auto"
          dir="rtl"
        >
          כאן אשתף במה שקורה במחקר ובפעילות הציבורית. כל המאמרים והמצגות ניתנים
          להורדה חינם ללא זכויות יוצרים.
        </p>

        <div className="mt-6 sm:mt-8 border-t pt-6 sm:pt-8">
          <div className="flex justify-center space-x-6">
            <a
              href="https://www.facebook.com/avshalom.elitzur"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-2xl transition-transform duration-200 transform hover:scale-200"
              aria-label="Facebook"
            >
              <FaFacebook />
            </a>
            <a
              href="https://www.youtube.com/@avshalomelitzur424"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 text-2xl transition-transform duration-200 transform hover:scale-200"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
