"use client";

import React, { useMemo } from "react";

export default function LearningReChart({ resultData }) {
  const { difficultKeysData, maxDifficulty, maxHeight } = useMemo(() => {
    const defaultData = [
      { key: "A", value: 30 },
      { key: "B", value: 28 },
    ];
    let keys = defaultData;
    if (resultData?.difficultKeys && Array.isArray(resultData.difficultKeys)) {
      keys = resultData.difficultKeys;
    }
    const difficulties = keys.map(
      (d) =>
        d.difficulty !== undefined
          ? d.difficulty
          : d.value !== undefined
            ? d.value
            : 0
    );
    const maxDiff = difficulties.length > 0 ? Math.max(...difficulties, 1) : 100;
    return {
      difficultKeysData: keys,
      maxDifficulty: maxDiff,
      maxHeight: 100,
    };
  }, [resultData]);

  return (
    <div className="bg-white p-4 w-full max-w-full text-sm mb-3">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold">Difficult Keys in this Exercise</h2>
      </div>
      <div className="border border-black overflow-visible">
        <div className="relative min-h-[125px]">
          <div className="absolute top-0 left-0 w-full h-1/3 border-b border-green-300 flex items-center justify-end pr-2 text-xs text-gray-600 pointer-events-none">
            Problematic
          </div>
          <div className="absolute top-1/3 left-0 w-full h-1/3 border-b border-green-300 flex items-center justify-end pr-2 text-xs text-gray-600 pointer-events-none">
            Difficult
          </div>
          <div className="absolute top-2/3 left-0 w-full h-1/3 flex items-center justify-end pr-2 text-xs text-gray-600 pointer-events-none">
            OK
          </div>
          <div
            className="flex flex-wrap gap-x-1 sm:gap-x-2 md:gap-x-3 gap-y-2 items-end justify-center px-2 sm:px-4 pt-1"
            style={{ paddingBottom: "5px", minHeight: "125px" }}
          >
            {difficultKeysData.length > 0 ? (
              difficultKeysData.map((item, index) => {
                const difficultyValue =
                  item.difficulty !== undefined
                    ? item.difficulty
                    : item.value !== undefined
                      ? item.value
                      : 0;
                const keyName = item.key || item.name || "?";
                let barColor = "bg-green-400";
                if (difficultyValue >= 3) barColor = "bg-red-500";
                else if (difficultyValue >= 1) barColor = "bg-yellow-500";

                let heightPercentage;
                if (maxDifficulty <= 1 && difficultyValue === 0) {
                  heightPercentage = 20;
                } else if (maxDifficulty > 1) {
                  heightPercentage = Math.max(
                    (difficultyValue / maxDifficulty) * 100,
                    10
                  );
                } else {
                  heightPercentage = difficultyValue > 0 ? 50 : 20;
                }

                const barWidth =
                  difficultKeysData.length > 15
                    ? "w-3 sm:w-4"
                    : difficultKeysData.length > 10
                      ? "w-4 sm:w-5"
                      : "w-4 sm:w-6";
                const barHeight = Math.max(
                  (heightPercentage / 100) * maxHeight,
                  10
                );
                const frequency = item.frequency || 1;

                return (
                  <div
                    key={`${keyName}-${index}`}
                    className="flex flex-col items-center justify-end flex-shrink-0"
                    title={`${keyName}: ${difficultyValue} error(s) (appeared ${frequency} time(s))`}
                  >
                    <div
                      className={`${barColor} ${barWidth} transition-all rounded-t mb-1`}
                      style={{
                        height: `${barHeight}px`,
                        minHeight: "10px",
                        maxHeight: "120px",
                      }}
                    />
                    <span className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap font-semibold mb-0.5">
                      {keyName}
                    </span>
                    <span className="text-[8px] sm:text-[10px] text-gray-500">
                      {difficultyValue}
                    </span>
                    {frequency > 1 && (
                      <span className="text-[7px] sm:text-[9px] text-blue-500">
                        ({frequency}x)
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 w-full py-4 flex items-center justify-center h-full">
                <p>No keys data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
