// client/src/components/RecordList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Record = (props) => (
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
    <td className="p-4 align-middle">
      <input
        type="checkbox"
        checked={props.isSelected}
        onChange={() => props.handleSelect(props.data._id)}
      />
    </td>
    <td className="p-4 align-middle">{props.data.name}</td>
    <td className="p-4 align-middle">{props.data.position}</td>
    <td className="p-4 align-middle">{props.data.level}</td>
    <td className="p-4 align-middle">
      <div className="flex gap-2">
        <Link
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 h-9 rounded-md px-3"
          to={`/edit/${props.data._id}`}
        >
          Modify
        </Link>
        <button
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 hover:text-accent-foreground h-9 rounded-md px-3"
          type="button"
          onClick={() => {
            props.removeRecord(props.data._id);
          }}
        >
          Remove
        </button>
      </div>
    </td>
  </tr>
);

export default function RecordList() {
  const [recordData, setRecordData] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [levelOption, setLevelOption] = useState("");

  useEffect(() => {
    async function fetchRecords() {
      const response = await fetch(`http://localhost:5050/record/`);
      if (!response.ok) {
        console.error(`Error: ${response.statusText}`);
        return;
      }
      const result = await response.json();
      if (Array.isArray(result)) {
        setRecordData(result);
      } else {
        console.error("Unexpected format:", result);
        setRecordData([]);
      }
    }
    fetchRecords();
  }, []);

  const removeRecord = async (id) => {
    await fetch(`http://localhost:5050/record/${id}`, { method: "DELETE" });
    const updatedRecords = recordData.filter((el) => el._id !== id);
    setRecordData(updatedRecords);
  };

  const handleSelect = (id) => {
    setCheckedIds((prevChecked) =>
      prevChecked.includes(id)
        ? prevChecked.filter((checkedId) => checkedId !== id)
        : [...prevChecked, id]
    );
  };

  const handleSelectAll = () => {
    if (checkedIds.length === recordData.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(recordData.map((record) => record._id));
    }
  };

  const bulkRemoveRecords = async () => {
    const response = await fetch(`http://localhost:5050/record/bulk-delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: checkedIds }),
    });

    if (response.ok) {
      const remainingRecords = recordData.filter(
        (record) => !checkedIds.includes(record._id)
      );
      setRecordData(remainingRecords);
      setCheckedIds([]);
    } else {
      console.error("Failed to delete records");
    }
  };

  const onFileChange = (e) => {
    setUploadedFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!uploadedFile) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await fetch("http://localhost:5050/record/upload-excel", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const insertedRecords = await response.json();
        alert("Data uploaded successfully!");
        setUploadedFile(null);
        setRecordData(insertedRecords);
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error("Error during file upload:", err);
      alert("Error uploading the file");
    }
  };

  const filteredRecords = recordData
    .filter(
      (record) =>
        record.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        record.position.toLowerCase().includes(searchInput.toLowerCase())
    )
    .filter(
      (record) =>
        levelOption === "" || record.level.toLowerCase() === levelOption.toLowerCase()
    );

  const recordRows = () => {
    if (Array.isArray(filteredRecords)) {
      return filteredRecords.map((record) => (
        <Record
          data={record}
          removeRecord={() => removeRecord(record._id)}
          key={record._id}
          isSelected={checkedIds.includes(record._id)}
          handleSelect={handleSelect}
        />
      ));
    } else {
      return (
        <tr>
          <td colSpan="5">No records found</td>
        </tr>
      );
    }
  };

  return (
    <>
      <h3 className="text-lg font-semibold p-4">Employee Database</h3>

      <input
        type="text"
        placeholder="Find by Name or Role"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="mb-4 p-2 border"
      />

      <select
        value={levelOption}
        onChange={(e) => setLevelOption(e.target.value)}
        className="mb-4 p-2 border"
      >
        <option value="">All Levels</option>
        <option value="Intern">Intern</option>
        <option value="Junior">Junior</option>
        <option value="Senior">Senior</option>
      </select>

      <div className="border rounded-lg overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&amp;_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={checkedIds.length === recordData.length}
                  />
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Full Name
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Role
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Expertise Level
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Options
                </th>
              </tr>
            </thead>
            <tbody className="[&amp;_tr:last-child]:border-0">{recordRows()}</tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4 p-4">
        <button
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 h-9 rounded-md px-3"
          onClick={bulkRemoveRecords}
          disabled={checkedIds.length === 0}
        >
          Remove Selected
        </button>

        <div className="my-4">
          <input
            type="file"
            onChange={onFileChange}
            accept=".xlsx, .xls"
            className="mt-2 block w-full"
          />
        </div>

        <button
          onClick={uploadFile}
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 h-9 rounded-md px-3"
        >
          Upload and Save Data
        </button>
      </div>
    </>
  );
}
