import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from "@mui/material";
import { ReactNode } from "react";

type Props = MuiButtonProps & {
  children: ReactNode;
};

const MainButton = ({ children, ...props }: Props) => {
  return (
    <MuiButton
      type="submit"
      variant="contained"
      sx={{
        p: "0.6rem",
        backgroundColor: '#1976d2'
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default MainButton;
