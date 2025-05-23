"use client"; // Mark this component as a Client Component

import { useEffect, useRef, useState } from "react";
import Container from "@/app/_components/container";
import { EXAMPLE_PATH } from "@/lib/constants";
import React from "react";

const apiKey = "AIzaSyAmmT4-FHm8g6Ozkkq2_qvof9zekY2o7Vk"; // 유효한 YouTube Data API 키를 입력합니다.
const apiUrl = `https://www.googleapis.com/youtube/v3/videos`; // API URL
const part = "snippet,contentDetails"; // 조회하고자 하는 항목들을 입력합니다.

type FooterProps = {
  audioId: string;
  audioTitle: string;
  audioAuthor: string;
  isList: boolean;
};

// 볼륨 쿠키 읽기 함수
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

// 볼륨 쿠키 저장 함수
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export function Footer({ audioTitle, audioAuthor, audioId, isList }: FooterProps) {
  const playerRef = useRef<any>(null);  // Using any since YT types aren't available by default
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLInputElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const [volume, setVolume] = useState(50); // 볼륨 상태 추가
  const [isVolumeInitialized, setIsVolumeInitialized] = useState(false); // 볼륨 초기화 여부 추가
  const [showVolumeNotice, setShowVolumeNotice] = useState(false);
  const [showManualNotice, setShowManualNotice] = useState(false);

  // 마운트 시 쿠키에서 볼륨 읽기
  useEffect(() => {
    const cookieVolume = getCookie('playerVolume');
    if (cookieVolume) {
      setVolume(Number(cookieVolume));
      // 플레이어가 이미 있으면 즉시 반영
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(Number(cookieVolume));
      }
    }
  }, []);

  useEffect(() => {
    const url = `${apiUrl}?part=${part}&id=${audioId}&key=${apiKey}`; // 완성된 요청 URL
    if (typeof window !== 'undefined') {
      // Load the YouTube IFrame Player API script
      if (!(window as any).YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Ensure onYouTubeIframeAPIReady is set only once
        if (!(window as any).onYouTubeIframeAPIReady) {
          (window as any).onYouTubeIframeAPIReady = () => {
            console.log("YouTube IFrame Player API Ready");
            createPlayer();
          };
        }
      } else {
        // If YT is already loaded, create player in next tick
        setTimeout(() => {
          createPlayer();
        }, 0);
      }

      // The API will call this function when the video player is ready.
      const onPlayerReady = (event: { target: any }) => {
        console.log("Player Ready");
        console.log("Player Object:", event.target); // 추가된 로깅
        if (event.target && typeof event.target.getCurrentTime === 'function') {
          setDuration(event.target.getDuration());
          setIsLoading(false); // 로딩 상태 해제

          // 사용자 상호작용(내부 클릭 등)으로 진입했는지 감지
          function isUserNavigation() {
            if (typeof document === 'undefined') return false;
            return document.referrer && document.referrer.startsWith(window.location.origin);
          }
          const userNavigated = isUserNavigation();
          const cookieVolume = getCookie('playerVolume');
          const targetVolume = cookieVolume ? Number(cookieVolume) : 50;

          if (userNavigated) {
            // 바로 저장된 볼륨으로
            setVolume(targetVolume);
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
              playerRef.current.setVolume(targetVolume);
            }
            setIsVolumeInitialized(true);
            // 자동재생
            if (!isPlaying) {
              playerRef.current.playVideo();
              setIsPlaying(true);
            }
          } else {
            // 기존 트릭(볼륨 0 → 딜레이 → 저장값)
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
              playerRef.current.setVolume(0);
            }
            setVolume(0);
            setShowVolumeNotice(true);
            setTimeout(() => {
              setVolume(targetVolume);
              if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
                playerRef.current.setVolume(targetVolume);
              }
              setIsVolumeInitialized(true);
              setTimeout(() => setShowVolumeNotice(false), 2000);
              // 만약 볼륨이 여전히 0이면(정책에 막힌 경우) 안내
              setTimeout(() => {
                if (playerRef.current && typeof playerRef.current.getVolume === 'function') {
                  if (playerRef.current.getVolume() === 0) {
                    setShowManualNotice(true);
                    setTimeout(() => setShowManualNotice(false), 4000);
                  }
                }
              }, 2200);
            }, 1600);
            // 버튼도 정지 상태로 명시
            setIsPlaying(false);
          }

          // Start interval to update currentTime every 100ms
          intervalRef.current = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
              const newCurrentTime = playerRef.current.getCurrentTime();
              setCurrentTime(newCurrentTime);
            } else {
              console.log("Player is not ready yet.");
            }
          }, 100);
        } else {
          console.error("Player object does not have getCurrentTime method");
        }
      }

      // Function to create the player
      const createPlayer = () => {
        if (playerRef.current) {
          playerRef.current.destroy(); // 기존 플레이어 제거
        }
        if (isList) {
          playerRef.current = new (window as any).YT.Player("player", {
            playerVars: {
              listType: 'playlist',
              list: audioId,
              autoplay: 1, // 자동 재생 설정
              controls: 0,
              mute: 0, // 음소거 해제
              loop: 1, // islooping 대신 loop 사용
            },
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange,
            },
          });
        } else {
          playerRef.current = new (window as any).YT.Player("player", {
            videoId: audioId,
            playerVars: {
              autoplay: 1, // 자동 재생 설정
              controls: 0,
              mute: 0, // 음소거 해제
              loop: 1, // islooping 대신 loop 사용
            },
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange,
            },
          });
        }
        console.log("Player Created:", playerRef.current); // 추가된 로깅
      }

      // Cleanup function to remove the script tag and clear the interval when the component unmounts
      return () => {
        const scriptTag = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (scriptTag) {
          scriptTag.remove();
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (playerRef.current) {
          playerRef.current.destroy(); // 플레이어 제거
        }
      };
    }
  }, [audioId, audioTitle, audioAuthor, isVolumeInitialized]); // 의존성 배열 추가

  const togglePlay = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function' && typeof playerRef.current.pauseVideo === 'function') {
      console.log("Player is ready, toggling play state.");
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    } else {
      console.log("Player is not ready yet.");
    }
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (rect) {
        const offsetX = event.clientX - rect.left;
        const newTime = (offsetX / rect.width) * duration;
        playerRef.current.seekTo(newTime, true);
      }
    }
  };

  const nextVideo = () => {
    if (playerRef.current && typeof playerRef.current.nextVideo === 'function') {
      playerRef.current.nextVideo();
      setDuration(playerRef.current.getDuration());
    }
  };

  const prevVideo = () => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      if (currentTime > 3) {
        playerRef.current.seekTo(0, true);
      } else {
        playerRef.current.previousVideo();
      }
    }
  };

  const handleTimelineMouseDown = () => {
    setIsDragging(true);
  };

  const handleTimelineMouseUp = () => {
    setIsDragging(false);
  };

  function onPlayerStateChange(event: { data: number }) {
    console.log(event.data);
    if (event.data === 1) {
      setDuration(playerRef.current?.getDuration() || 0);
      setIsPlaying(true);
    }
    if (event.data === 0) {
      if (isList) {
        nextVideo();
      } else {
        setIsPlaying(false);
      }
    }
  }

  const handleTimelineMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (rect) {
        const offsetX = event.clientX - rect.left;
        const newTime = (offsetX / rect.width) * duration;
        playerRef.current.seekTo(newTime, true);
      }
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value, 10);
    console.log(event.target.value, newVolume);
    setVolume(newVolume);
    setCookie('playerVolume', String(newVolume));
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(newVolume);
    }
  };

  return (
    <footer className="bg-slate-200 border-t border-none dark:bg-slate-800 fixed w-full bottom-0 px-0">
      {showVolumeNotice && (
        <div className="fixed left-1/2 bottom-24 z-50 px-4 py-2 bg-black text-white text-sm -translate-x-1/2 shadow-lg animate-fadein">
          플레이리스트 로딩 중...
        </div>
      )}
      {showManualNotice && (
        <div className="fixed left-1/2 bottom-24 z-50 px-4 py-2 bg-red-600 text-white text-sm -translate-x-1/2 shadow-lg animate-fadein">
          소리가 나지 않으면 브라우저 정책으로 인한 것이오니 <br></br>재생 버튼을 다시 눌러주세요.
        </div>
      )}
      {audioId ? (
        <div
          ref={timelineRef}
          className="w-full bg-gray-300 h-0.5 relative cursor-pointer"
          onClick={handleTimelineClick}
          onMouseDown={handleTimelineMouseDown}
          onMouseUp={handleTimelineMouseUp}
          onMouseMove={handleTimelineMouseMove}
        >
          <div
            className="absolute h-full bg-black"
            style={{ width: `${(currentTime / duration) * 100}%`, zIndex: 100 }}
          ></div>
        </div>
      ) : (
        <div></div>
      )}
      <Container>
        <div id="player" className="w-full max-w-screen-sm hidden"></div> {/* Ensure the player div is not hidden */}
        {audioId ? (
          <div className="py-1.5 flex flex-row lg:flex-row justify-between items-center">
            {isLoading ? (
              <div></div>
            ) : (
              <div className="w-full pl-0 flex-grow-1 mr-4 whitespace-nowrap overflow-hidden overflow-ellipsis">
                {!isList ? (
                  <a href={`https://www.youtube.com/watch?v=${audioId}`}>
                    {audioTitle}
                  </a>
                ) : (
                  <a href={`https://www.youtube.com/playlist?list=${audioId}`}>
                    {audioTitle}
                  </a>
                )}
                <h2 className="text-gray-400 overflow-hidden overflow-ellipsis">{audioAuthor}</h2>
              </div>
            )}
            {isLoading ? (
              <div></div> // 로딩 중일 때 표시할 내용
            ) : (
              <div className="w-20 block flex-shrink-0">
                <div className="float-none">
                  <button onClick={prevVideo} className="float-left mt-1 ml-0 mx-2 my-0 p-0 bg-transparent border-none text-black focus:outline-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="currentcolor"
                      viewBox="0 0 13 13"
                    >
                      <polyline points="0 0 3 0 3 6 13 0 13 13 3 7 3 13 0 13" />
                    </svg>
                  </button>
                  <button
                    onClick={togglePlay}
                    className="float-left mx-2 mt-1 my-0 p-0 bg-transparent border-none text-black focus:outline-none"
                  >
                    {isPlaying ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="currentcolor"
                        viewBox="0 0 13 13"
                        stroke="currentColor"
                      >
                        <path strokeWidth={9} d="M0 0v13m13-13v13" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="currentcolor"
                        viewBox="0 0 13 13"
                      >
                        <polyline points="0 0 13 6.5 0 13" />
                      </svg>
                    )}
                  </button>
                  <button onClick={nextVideo} className="float-left mx-2 mr-0 mt-1 my-0 p-0 bg-transparent border-none text-black focus:outline-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="currentcolor"
                      viewBox="0 0 13 13"
                    >
                      <polyline points="0 0 10 6 10 0 13 0 13 13 10 13 10 7 0 13 0 0" />
                    </svg>
                  </button>
                </div>
                { navigator.maxTouchPoints == 0 ? (
                  <input
                    ref={volumeRef}
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="slider mx-0"
                    style={{ background: `linear-gradient(to right, #000000 0%, #000 ${volume}%, #ccc ${volume}%, #ccc 100%)` }}
                  />
                ) : (
                  <div></div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div></div>
        )}
      </Container>
    </footer>
  );
}

export default Footer;