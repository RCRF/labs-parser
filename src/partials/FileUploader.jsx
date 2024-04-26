import React, { useState } from 'react';
import Papa from 'papaparse';

// Parses the range into an array of numbers
const parseRange = (range) => {
    if (typeof range !== 'string') return [0, 0];
    range = range.replace(/[^0-9\-.,]/g, '').trim();
    let parts = range.split('-').map(Number);
    if (parts.length === 1) {
        parts.push(parts[0]);
    }
    return parts;
};

// Checks if two ranges are similar within a tolerance
const areRangesSimilar = (range1, range2) => {
    const [min1, max1] = parseRange(range1);
    const [min2, max2] = parseRange(range2);
    return Math.abs(min1 - min2) < 5 && Math.abs(max1 - max2) < 5;
};

// Calculates similarity between two strings using a simplified Levenshtein-like method
const calculateSimilarity = (s1, s2) => {
    if (!s1 || !s2) return 0;

    // Check if the only difference between s1 and s2 are '%' and '#'
    const cleanS1 = s1.replace(/[%#]/g, '');
    const cleanS2 = s2.replace(/[%#]/g, '');
    if (cleanS1 === cleanS2) return 0;

    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = new Array(s2.length + 1);

    for (let i = 0; i <= s2.length; i++) {
        costs[i] = i;
    }

    for (let i = 1; i <= s1.length; i++) {
        costs[0] = i;
        let lastValue = i - 1;

        for (let j = 1; j <= s2.length; j++) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
        }

        costs[s2.length] = lastValue;
    }

    return 1 - (costs[s2.length] / Math.max(s1.length, s2.length));
};


// Main function to process lab data and find similar labs
const processLabsData = (data) => {
    return data.map(lab => {
        // find any lab that have similar names, then dedupe the synonyms
        const synonyms = data.filter(otherLab => {
            const similarity = calculateSimilarity(lab.labs, otherLab.labs);
            return similarity >= 0.90 && similarity < 1 && !areRangesSimilar(lab.lab_range, otherLab.lab_range);
        }
        ).map(otherLab => otherLab.labs)
            .filter((value, index, self) => self.indexOf(value) === index);

        //if there is an identifer key, remove it 
        if (lab.identifier) {
            delete lab.identifier;
        }

        //assign an auto-incrementing id to each lab
        lab.id = data.indexOf(lab);
        return {
            'possible_synonyms': synonyms.length > 0 ? 'TRUE' : 'FALSE',
            'synonyms': synonyms.join(' | '),
            ...lab,

        };
    });
};

const FileUploader = ({ onDataProcessed }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setLoading(true);
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const processedData = processLabsData(results.data);
                    setData(processedData);
                    onDataProcessed(processedData);
                    setLoading(false);
                },
            });
        }
    };
    const exportProcessedDataToCSV = () => {
        if (data.length === 0) {
            alert("No data to export. Please load and process a file first.");
            return;
        }

        let csvContent = Object.keys(data[1]).join(",") + "\n"; // Header

        data.forEach((row, index) => {
            const rowData = Object.values(row).map(
                //remove any commas from the values
                (value) => (typeof value === "string" ? value.replace(/,/g, '') : value)).
                join(",")
            csvContent += rowData + "\n";
        });


        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "updated_lab_listing.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    return (
        <div className='mx-auto w-full flex justify-center flex-col mt-10'>
            <div className="text-2xl font-semibold text-slate-700 flex mx-auto p-4">Upload a CSV file</div>
            <div className='flex flex-col mx-auto w-3/4 p-4 justify-center'>
                <div className='w-full justify-center flex mx-aut0'>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".csv"
                        className=" text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-white hover:file:bg-blue-800"
                    />
                </div>


                <div className=''>{!loading ? `` : "Loading..."}</div>

                {data.length > 0 && (
                    <div className='flex flex-row self-center justify-between w-full'>
                        <div className='self-center font-semibold text-lg'>Total Rows: {data.length}</div>
                        <button onClick={exportProcessedDataToCSV} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Export to CSV
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploader;
