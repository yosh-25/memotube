"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../lib/firebase";
import ShowMemos from "../components/elements/lists/AllMemos";
import { getDocs, collection, query, where } from "firebase/firestore";
import {
  Box,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BackspaceIcon from "@mui/icons-material/Backspace";
import {
  MemoList,
  MemosByVideoId,
  LatestTimestampByVideoId,
  FetchedMemo,
} from "../../types";
import CustomCardsForMemoList from "@/app/components/elements/cards/CustomCardsForMemoList";

function showMemoList() {
  const router = useRouter();
  const { currentUser }: any = useAuth();
  const YOUTUBE_SEARCH_API_URI = "https://www.googleapis.com/youtube/v3/search";
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const [memoListByVideoId, setMemoListByVideoId] = useState<MemosByVideoId>(
    {}
  );
  const [fetchTrigger, setFetchTrigger] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [sortedVideoIds, setSortedVideoIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [YTPlayer, setYTPlayer] = useState<YT.Player>();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [timeToShow, setTimeToShow] = useState<string>("0");
  const [memoList, setMemoList] = useState<MemoList>();

  if (!currentUser) router.replace("/signin"); // ログインしていなければサインインページへ転

  useEffect(() => {
    const secToTime = (seconds: number) => {
      const hour = Math.floor(seconds / 3600);
      const min = Math.floor((seconds % 3600) / 60);
      const sec = Math.floor(seconds % 60);
      let time = "";
      if (hour > 0) {
        time += `${hour}:`;
      }

      if (min > 0 || hour > 0) {
        time += `${min < 10 ? "0" + min : min}:`;
      } else {
        // 時間も分も0の場合、'0:'を先に追加
        time += "0:";
      }

      // 秒は常に二桁で表示
      time += `${sec < 10 ? "0" + sec : sec}`;

      return time;
    };
    setTimeToShow(secToTime(currentTime));
  }, [currentTime]);

  // マウント時firebaseからデータ取得
  
  const fetchMemoList = async () => {
    try {
      const q = query(
        collection(db, "memoList"),
        where("uid", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const memos: MemoList = querySnapshot.docs.map((doc) => {
        const {
          videoId,
          videoTitle,
          videoThumbnail,
          createdTime,
          createdAt,
          content,
          uid,
        } = doc.data();

        return {
          id: doc.id,
          videoId,
          videoTitle,
          videoThumbnail: videoThumbnail,
          createdTime,
          createdAt,
          content,
          uid,
        };
      });

      // videoIDごとにメモをグループ化する
      const memosGroupedByVideoId: MemosByVideoId = {};
      memos.forEach((memo) => {
        const videoId = memo.videoId;
        if (!memosGroupedByVideoId[videoId]) {
          memosGroupedByVideoId[videoId] = [];
        }
        memosGroupedByVideoId[videoId].push(memo);
      });
      setMemoListByVideoId(memosGroupedByVideoId);
    } catch (error) {
      console.error("Error fetching memos:", error);
    }
    console.log(memoListByVideoId);
  };

  useEffect(() => {
    fetchMemoList();
  }, []);

  // 各videoIdで直近のメモ作成日を抽出し、それを順番に並べ表示順を決める。
  const getLatestTime = (): LatestTimestampByVideoId => {
    const latestCreatedTimes: LatestTimestampByVideoId = {};
    Object.entries(memoListByVideoId).forEach(([videoId, memos]) => {
      const latestCreatedTime = memos
        .map((memo) => memo.createdTime)
        .sort(
          (a, b) => b.seconds - a.seconds || b.nanoseconds - a.nanoseconds
        )[0];
      latestCreatedTimes[videoId] = latestCreatedTime;
    });
    console.log("Latest created times by videoId:", latestCreatedTimes);
    return latestCreatedTimes;
  };

  const sortVideoIdsByLatestTimestamp = (
    listOfLatestTimesByVideo: LatestTimestampByVideoId
  ): string[] => {
    console.log("List of latest times by video:", listOfLatestTimesByVideo);
    const sortedVideoIds = Object.entries(listOfLatestTimesByVideo)
      .sort(([, timeA], [, timeB]) => {
        const dateA = timeA.toDate();
        const dateB = timeB.toDate();
        console.log(`Comparing ${dateA} and ${dateB}`);
        return dateB.getTime() - dateA.getTime();
      })
      .map(([videoId]) => videoId);
    console.log("Sorted video IDs by latest timestamp:", sortedVideoIds);
    return sortedVideoIds;
  };

  // メモリストをソートして状態を更新する
  useEffect(() => {
    const listOfLatestTimesByVideo = getLatestTime();
    const sortedVideoIds = sortVideoIdsByLatestTimestamp(
      listOfLatestTimesByVideo
    );
    console.log("Setting sortedVideoIds:", sortedVideoIds);
    setSortedVideoIds(sortedVideoIds);
  }, [memoListByVideoId]);

  // リスト内で前方一致のメモを抽出
  const searchContents = (searchQuery: string) => {
    const searchItem = searchQuery.toLowerCase();
    const matchingMemos: MemosByVideoId = {};
    Object.entries(memoListByVideoId).forEach(([videoId, memos]) => {
      memos.forEach((memo) => {
        if (memo.content.toLowerCase().includes(searchItem)) {
          if (!matchingMemos[videoId]) {
            matchingMemos[videoId] = [];
          }
          matchingMemos[videoId].push(memo);
        }
      });
    });
    setMemoListByVideoId(matchingMemos);
    console.log(matchingMemos);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "80%",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontSize: {
              xs: "2em",
              md: "3em",
            },
            textAlign: "center",
            mb: "1em",
          }}
        >
          メモ一覧
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            width: "100%",
          }}
        >
          <TextField
            label="メモを検索"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 4, width: "20em" }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => searchContents(searchQuery)}
                  >
                    <SearchIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => fetchMemoList()}>
                    <BackspaceIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {sortedVideoIds.map((videoId)=> (
        memoListByVideoId && (
        <CustomCardsForMemoList
          key={videoId}
          videoId={videoId}
          memos={memoListByVideoId[videoId]}
        />
        )))}
      </Box>
    </Box>
  );
}
export default showMemoList;
