import React, { useEffect, useState } from "react";
import { AppBackHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
/* @ts-ignore */
import { JIFFClient, JIFFClientBigNumber } from "jiff-mpc";
import { toast } from "sonner";
import { BigNumber } from "bignumber.js";
import Rating from "@mui/material/Rating";
import { Input } from "@/components/Input";
import { getAuthToken } from "@/lib/client/localStorage";
import { Room, RoomMember } from "@prisma/client";
import { Spinner } from "@/components/Spinner";
import { classed } from "@tw-classed/react";

enum OutputState {
  NOT_CONNECTED,
  AWAITING_OTHER_PARTIES_CONNECTION,
  CONNECTED,
  AWAITING_OTHER_PARTIES_INPUTS,
  COMPUTING,
  SHOW_RESULTS,
  ERROR,
}

const Title = classed.h3("block font-inter text-white", {
  variants: {
    size: {
      small: "text-base leading-1 font-semibold",
      medium: "text-[21px] leading-5 font-medium",
    },
  },
  defaultVariants: {
    size: "small",
  },
});

const Description = classed.span("text-md text-iron-600 leading-5");

const fruits = [
  "Apple",
  "Banana",
  "Cherry",
  "Date",
  "Elderberry",
  "Fig",
  "Grape",
  "Honeydew",
  "Kiwi",
  "Lemon",
];

export default function Fruits() {
  const [createRoomName, setCreateRoomName] = useState<string>();
  const [createRoomPassword, setCreateRoomPassword] = useState<string>("");
  const [createRoomPartyCount, setCreateRoomPartyCount] = useState<number>();
  const [hasCreatedRoom, setHasCreatedRoom] = useState<boolean>(false);
  const [roomName, setRoomName] = useState<string>();
  const [allRooms, setAllRooms] = useState<
    Record<string, Room & { members: RoomMember[] }>
  >({});
  const [jiffClient, setJiffClient] = useState<typeof JIFFClient | null>(null);
  const [ratings, setRatings] = useState<number[]>(
    Array(fruits.length).fill(0)
  );
  const [output, setOutput] = useState<OutputState>(OutputState.NOT_CONNECTED);
  const [avgResults, setAvgResults] = useState<number[]>([]);
  const [stdResults, setStdResults] = useState<number[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [loadingCreateRoom, setLoadingCreateRoom] = useState<boolean>(false);
  const [loadingJoin, setLoadingJoin] = useState<number>();

  useEffect(() => {
    const fetchRooms = async () => {
      const response = await fetch("/api/mpc/get_all_rooms");
      const { rooms } = await response.json();
      const roomsMapping = rooms.reduce(
        (acc: Record<string, Room>, room: Room) => {
          acc[room.name] = room;
          return acc;
        },
        {}
      );
      setCreateRoomName(undefined);
      setCreateRoomPartyCount(undefined);
      setCreateRoomPassword("");
      setLoadingRooms(false);
      setAllRooms(roomsMapping);
    };
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    setLoadingCreateRoom(true);
    if (!createRoomName || !createRoomPartyCount) {
      setLoadingCreateRoom(false);
      return toast.error("Please fill in all fields");
    }

    const newRoomName = "FRUIT-" + createRoomName;

    if (createRoomPartyCount < 2) {
      setLoadingCreateRoom(false);
      return toast.error("Party count must be at least 2");
    }

    if (/\s/.test(createRoomName)) {
      setLoadingCreateRoom(false);
      return toast.error("Room name cannot contain whitespace");
    }

    const authToken = getAuthToken();
    if (!authToken) {
      return toast.error("Please login to create a room");
    }

    const response = await fetch("/api/mpc/create_room", {
      method: "POST",
      body: JSON.stringify({
        authToken: authToken.value,
        name: newRoomName,
        numParties: createRoomPartyCount,
        password: createRoomPassword,
      }),
    });

    if (response.ok) {
      const response = await fetch("/api/mpc/get_all_rooms");
      const { rooms } = await response.json();
      const roomsMapping = rooms.reduce(
        (acc: Record<string, Room>, room: Room) => {
          acc[room.name] = room;
          return acc;
        },
        {}
      );
      setAllRooms(roomsMapping);
      setRoomName(newRoomName);
      setHasCreatedRoom(true);
      connect(newRoomName, createRoomPartyCount);
      toast.success("Room created successfully");
    } else {
      const { error } = await response.json();
      toast.error(error);
    }
    setLoadingCreateRoom(false);
  };

  const connect = (roomName: string, numParties: number) => {
    if (!roomName || numParties < 2) {
      toast.error("Please enter a valid room name and party count.");
      return;
    }

    const client = new JIFFClient(
      process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : "https://mpc-fruits.onrender.com",
      roomName,
      {
        autoConnect: false,
        party_count: numParties,
        crypto_provider: true,
        // @ts-ignore
        onError: (_, error) => {
          console.error(error);
          if (
            error.includes("Maximum parties capacity reached") ||
            error.includes("contradicting party count")
          ) {
            setLoadingJoin(undefined);
            setLoadingCreateRoom(false);
            toast.error("Computation is full. Try another computation ID.");
          }
          setOutput(OutputState.ERROR);
        },
        onConnect: () => {
          console.log("Connected to server");
          setOutput(OutputState.CONNECTED);
        },
      }
    );

    client.apply_extension(JIFFClientBigNumber, {});
    client.connect();
    setOutput(OutputState.AWAITING_OTHER_PARTIES_CONNECTION);
    setJiffClient(client);
  };

  const submit = async () => {
    if (ratings.some((rating) => rating < 1 || rating > 5)) {
      toast.error("All ratings must be between 1 and 5.");
      return;
    }

    setOutput(OutputState.AWAITING_OTHER_PARTIES_INPUTS);

    if (jiffClient) {
      console.log(`Beginning MPC with ratings ${ratings}`);
      let shares = await jiffClient.share_array(ratings);
      console.log("Shares: ", shares);
      setOutput(OutputState.COMPUTING);

      // Start average computation
      const startAverageTime = Date.now();

      let sumShares: any[] = [];
      for (let i = 1; i <= jiffClient.party_count; i++) {
        for (let j = 0; j < fruits.length; j++) {
          if (i === 1) {
            sumShares.push(shares[i][j]);
          } else {
            sumShares[j] = sumShares[j].sadd(shares[i][j]);
          }
        }
      }

      // for (let k = 0; k < sumShares.length; k++) {
      //   sumShares[k] = sumShares[k].cdiv(jiffClient.party_count);
      // }
      // console.log("Averaged Sum Shares: ", sumShares);

      const sumResults = await Promise.all(
        sumShares.map((share: any) => jiffClient.open(share))
      );
      console.log("Sum Results: ", sumResults);
      const averageResults = sumResults.map(
        (result: BigNumber) => result.toNumber() / jiffClient.party_count
      );
      console.log("Average Results: ", averageResults);

      const averageTime = Date.now() - startAverageTime;
      console.log("Average Time: ", averageTime);

      // Start standard deviation computation
      const startStdTime = Date.now();

      let squaredSumShares: any[] = [];
      for (let i = 0; i < sumShares.length; i++) {
        squaredSumShares.push(sumShares[i].smult(sumShares[i]));
      }

      let sumOfSquaresShares: any[] = [];
      for (let i = 1; i <= jiffClient.party_count; i++) {
        for (let j = 0; j < sumShares.length; j++) {
          const shareSquared = shares[i][j].smult(shares[i][j]);
          if (i === 1) {
            sumOfSquaresShares.push(shareSquared);
          } else {
            sumOfSquaresShares[j] = sumOfSquaresShares[j].sadd(shareSquared);
          }
        }
      }
      for (let k = 0; k < sumOfSquaresShares.length; k++) {
        sumOfSquaresShares[k] = sumOfSquaresShares[k].cmult(
          jiffClient.party_count
        );
      }

      let stdResultShares: any[] = [];
      for (let i = 0; i < sumShares.length; i++) {
        const squaredSum = squaredSumShares[i];
        const sumOfSquares = sumOfSquaresShares[i];
        const stdResult = sumOfSquares.ssub(squaredSum);
        stdResultShares.push(stdResult);
      }

      const rawStdResults = await Promise.all(
        stdResultShares.map((diff: any) => jiffClient.open(diff))
      );
      const stdResults = rawStdResults.map((result: BigNumber) =>
        Math.sqrt(
          result.toNumber() /
            (jiffClient.party_count * (jiffClient.party_count - 1))
        )
      );
      console.log("Std Results:", stdResults);

      const stdTime = Date.now() - startStdTime;
      console.log("Std Time: ", stdTime);

      setAvgResults(averageResults);
      setStdResults(stdResults);
      setOutput(OutputState.SHOW_RESULTS);
      toast.success(
        `MPC runtime: ${averageTime}ms for average, ${stdTime}ms for standard deviation`
      );

      console.log("ending", hasCreatedRoom);
      if (hasCreatedRoom) {
        try {
          const authToken = getAuthToken();

          await fetch("/api/mpc/expire_room", {
            method: "POST",
            body: JSON.stringify({
              authToken: authToken!.value,
              roomId: allRooms[roomName!].id,
            }),
          });
        } catch (error) {
          console.error("Submitting ratings failed", error);
        }
      }
    }
  };

  const getButtonDisplay = (): string => {
    switch (output) {
      case OutputState.NOT_CONNECTED:
        return "Connect";
      case OutputState.AWAITING_OTHER_PARTIES_CONNECTION:
        return "Awaiting other parties connection...";
      case OutputState.CONNECTED:
        return "Submit ratings to proceed!";
      case OutputState.AWAITING_OTHER_PARTIES_INPUTS:
        return "Awaiting other parties inputs...";
      case OutputState.COMPUTING:
        return "Computing...";
      case OutputState.SHOW_RESULTS:
        return "The fruits have been rated by the crowd!";
      case OutputState.ERROR:
        return "Error - please try again";
    }
  };

  if (roomName) {
    return (
      <div>
        <AppBackHeader
          onBackClick={() => {
            if (output !== OutputState.SHOW_RESULTS) {
              let choice = window.confirm(
                "Are you sure you want to leave? This will end the computation for the entire room."
              );
              if (choice) {
                setRoomName(undefined);
              }
            } else {
              setRoomName(undefined);
            }
          }}
        />

        <div className="flex flex-col gap-6 h-modal">
          <div className="flex flex-col gap-6">
            <span className="text-lg xs:text-xl text-whiteading-6 font-medium">
              🍎 Rate fruits
            </span>
            <span className="text-iron-600 text-sm font-normal">{`Rate some fruits with your friends, discover how aligned you
                      are without revealing any specific votes.`}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-lg xs:text-xl text-white leading-6 font-medium">
              {roomName}
            </span>
            <Description>{getButtonDisplay()}</Description>
          </div>
          <div>
            {output === OutputState.CONNECTED && (
              <div className="mb-16">
                {fruits.map((fruit, index) => (
                  <div key={index} className="mb-4">
                    <label className="block text-black mb-2">{fruit}</label>
                    <Rating
                      name={`rating-${index}`}
                      value={ratings[index]}
                      onChange={(event, newValue) => {
                        const newRatings = [...ratings];
                        newRatings[index] = newValue || 0;
                        setRatings(newRatings);
                      }}
                      max={5}
                    />
                  </div>
                ))}
                <Button onClick={submit}>Submit</Button>
              </div>
            )}
            {output === OutputState.SHOW_RESULTS && (
              <div className="text-black">
                <div className="flex flex-col gap-4">
                  {fruits
                    .map((fruit, index) => ({
                      fruit,
                      rating: avgResults[index],
                    }))
                    .sort((a, b) => b.rating - a.rating)
                    .map(({ fruit, rating }, index) => (
                      <div
                        className="flex flex-row align-center gap-2"
                        key={index}
                      >
                        {`${fruit} `}
                        <Rating value={rating} readOnly precision={0.01} />
                        {`(${rating.toFixed(1)}, std: ${stdResults[
                          fruits.indexOf(fruit)
                        ].toFixed(2)})`}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppBackHeader />

      <div className="flex flex-col gap-6 h-modal">
        <div className="flex flex-col gap-6">
          <span className="text-lg xs:text-xl text-white leading-6 font-medium">
            🍎 Rate fruits
          </span>
          <div className="flex flex-col gap-2">
            <span className="text-iron-600 text-sm font-normal">
              {`Rate some fruits with your friends, discover how aligned you
              are without revealing any specific votes.`}
            </span>
            <span className="text-iron-600 text-sm font-normal">
              {`Find a group of 3 or more people 
              and set your party size accordingly.`}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Title>Join a room</Title>
            <div className="flex flex-col gap-2">
              {loadingRooms ? (
                <Spinner />
              ) : Object.values(allRooms).length === 0 ? (
                <span className="text-iron-600 text-sm font-normal">
                  No rooms available
                </span>
              ) : (
                Object.values(allRooms).map((room) =>
                  room.members.length < room.numParties &&
                  room.name.startsWith("FRUIT-") ? (
                    <div
                      key={room.id}
                      className="flex items-center justify-between"
                    >
                      <Description>
                        {room.name} ({room.members.length}/{room.numParties}{" "}
                        members)
                      </Description>
                      <div className="max-w-[100px] ml-auto py-2">
                        <Button
                          size="small"
                          variant="tertiary"
                          disabled={
                            loadingJoin !== undefined && loadingJoin !== room.id
                          }
                          loading={loadingJoin === room.id}
                          onClick={async () => {
                            let password = window.prompt(
                              "Enter room password."
                            );

                            if (password === null) {
                              password = "";
                            }

                            setLoadingJoin(room.id);
                            const authToken = getAuthToken();
                            if (!authToken) {
                              return toast.error("Please login to join a room");
                            }

                            const response = await fetch("/api/mpc/join_room", {
                              method: "POST",
                              body: JSON.stringify({
                                authToken: authToken.value,
                                roomId: room.id,
                                password: password,
                              }),
                            });
                            if (!response.ok) {
                              const { error } = await response.json();
                              setLoadingJoin(undefined);
                              return toast.error(error);
                            }

                            setRoomName(room.name);
                            setHasCreatedRoom(false);
                            connect(room.name, room.numParties);
                            setLoadingJoin(undefined);
                          }}
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <></>
                  )
                )
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 mb-16">
            <div className="flex flex-col gap-1 ">
              <Title>Create new room</Title>
            </div>
            <Input
              label="Room name"
              value={createRoomName}
              onChange={(e) => setCreateRoomName(e.target.value)}
            />
            <Input
              label="Party count"
              type="number"
              value={createRoomPartyCount}
              onChange={(e) =>
                e.target.value
                  ? setCreateRoomPartyCount(Number(e.target.value))
                  : setCreateRoomPartyCount(undefined)
              }
            />
            <Input
              label="Password"
              value={createRoomPassword}
              onChange={(e) => setCreateRoomPassword(e.target.value)}
            />
            <Button onClick={handleCreateRoom} loading={loadingCreateRoom}>
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

Fruits.getInitialProps = () => {
  return { showHeader: false, showFooter: false };
};
