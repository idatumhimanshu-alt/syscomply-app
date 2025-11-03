import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#ff416c", // Pinkish-red color
    },
    secondary: {
      main: "#6610f2", // Purple color
    },
    background: {
      default: "linear-gradient(to bottom,rgb(168, 107, 130),rgb(122, 100, 156))",
    },
  },
  typography: {
    fontFamily: "Poppins, sans-serif",
  },
  components: {
   
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            background: "#fff",
            "& fieldset": { borderColor: "#ddd" },
            "&:hover fieldset": { borderColor: "#888" },
          },
        },
      },
    },
  },
});

export default theme;
