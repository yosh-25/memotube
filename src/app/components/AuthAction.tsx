"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import MainButton from "./elements/buttons/mainButton";
import Link from "next/link";
import { AuthContextType } from "@/types";

const AuthAction = () => {
  const router = useRouter();
  const { currentUser }: AuthContextType = useAuth();
  const auth = getAuth();

  // ログアウト処理
  const doLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("ログアウト完了！");
        router.push("/signin");
      })
      .catch((error) => {
        console.log(error);
      });
  };
  return (
    <>
      {currentUser ? (
        <Box suppressHydrationWarning={true}>
          <MainButton onClick={doLogout}>ログアウト </MainButton>
        </Box>
      ) : (
        <Link href="./signin">
          <Typography
            suppressHydrationWarning={true}
            sx={{ fontSize: { xs: "0.6rem", md: "1rem" } }}
          >
            会員登録/ログインはこちら
          </Typography>
        </Link>
      )}
    </>
  );
};

export default AuthAction;