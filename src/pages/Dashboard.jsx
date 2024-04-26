import React, { useState, useMemo, useEffect } from "react";

import Header from "../partials/Header";
import FileUploader from "../partials/FileUploader";
import MultiSelectTypeahead from "../partials/MultiSelectTypeahead";

export const Dashboard = ({ type }) => {
  const [selectedTab, setSelectedTab] = useState("FALSE");
  const [tableData, setTableData] = useState([]);


  const handleDataFromChild = (data) => {
    setTableData(data);
  };

  const columns = React.useMemo(() => {
    if (tableData.length === 0) return [];

    return Object.keys(tableData[0]).map(key => ({
      Header: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize header
      accessor: key // The attribute to access the data
    }));
  }, [tableData]);


  const handleSynonymsChange = (row, newSynonyms) => {
    debugger;
    const newData = [...tableData];

    //find index of the row
    const index = newData.findIndex(i => i.id === row.id);
    newData[index].synonyms = newSynonyms.join(' | ');
    debugger;
    setTableData(newData);
  };


  return (
    <>
      <div className="flex h-screen overflow-hidden ">
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden w-full">
          <Header />
          <main>

            <FileUploader onDataProcessed={handleDataFromChild} />
            {tableData.length > 0 && (
              <div>
                <div className='self-center font-semibold flex mx-auto text-slate-500 w-3/4 pl-2'>Selected Rows: {tableData.filter(i => i.possible_synonyms === selectedTab).length}</div>
                <div className="flex mx-auto my-2 w-3/4">
                  <button
                    className={`mx-2 px-4 py-2 rounded-md ${selectedTab === 'TRUE' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
                    onClick={() => setSelectedTab('TRUE')}
                  >
                    Suggested Synonyms
                  </button>
                  <button
                    className={`mx-2 px-4 py-2 rounded-md ${selectedTab === 'FALSE' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
                    onClick={() => setSelectedTab('FALSE')}
                  >
                    Unmapped
                  </button>
                </div>

              </div>
            )}


            <div className="w-3/4 mx-auto bg-white overflow-scroll">
              <table className="">
                <thead className="overflow-auto">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.Header} className="px-4 py-2">
                        {column.Header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="overflow-auto">
                  {tableData.filter(i => i.possible_synonyms === selectedTab).sort(
                    (a, b) => a.labs - b.labs).
                    map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={index} className="border px-4 py-2">
                            {i === 1 ? (
                              <div className="min-w-56">
                                <MultiSelectTypeahead
                                  items={value !== "" ? value.split(' | ').map(v => ({ label: v, value: v })) : []}
                                  onValueChange={(newValue) => handleSynonymsChange(row, newValue)}
                                  placeholder="Select synonyms"
                                  defaultValue={value !== "" ? value.split(' | ').map(v => ({ label: v, value: v })) : []}
                                />
                              </div>
                            ) : value
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>



          </main>
        </div>
      </div>

    </>
  );
};

export default Dashboard;
