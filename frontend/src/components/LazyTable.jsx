import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";

export default function LazyTable({
  route,
  columns,
  defaultPageSize,
  rowsPerPageOptions,
}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize ?? 10);

  useEffect(() => {
    fetch(`${route}?page=${page}&page_size=${pageSize}`)
      .then((res) => res.json())
      .then((resJson) => setData(resJson));
  }, [route, page, pageSize]);

  const handleChangePage = (e, newPage) => {
    if (newPage < page || data.length === pageSize) {
      setPage(newPage + 1);
    }
  };

  const handleChangePageSize = (e) => {
    const newPageSize = parseInt(e.target.value, 10);
    setPageSize(newPageSize);
    setPage(1);
  };

  const defaultRenderCell = (col, row) => {
    return <div>{row[col.field]}</div>;
  };


  const whiteTextStyle = { color: "white" };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (

              <TableCell key={col.headerName} sx={whiteTextStyle}>
                {col.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (

                <TableCell key={col.headerName} sx={whiteTextStyle}>
                  {col.renderCell
                    ? col.renderCell(row)
                    : defaultRenderCell(col, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>


        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions ?? [5, 10, 25]}
          count={-1}
          rowsPerPage={pageSize}
          page={page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangePageSize}
          sx={{
            color: "white", // Text color
            ".MuiSvgIcon-root": { color: "white" }, // Arrow icons
            ".MuiTablePagination-selectLabel": { color: "white" }, // "Rows per page" text
            ".MuiTablePagination-displayedRows": { color: "white" }, // "1-10 of ..." text
            ".MuiSelect-icon": { color: "white" }, // Dropdown arrow
            ".MuiIconButton-root.Mui-disabled": { color: "rgba(255,255,255,0.3)" } // Disabled arrows
          }}
        />
      </Table>
    </TableContainer>
  );
}