import { NextResponse } from "next/server";

type ApiResponse<T = any> = {
  status: "success" | "error";
  message: string;
  data?: T;
};

export function successResponse<T>(message: string, data?: T, statusCode = 200) {
  const response: ApiResponse<T> = {
    status: "success",
    message,
    data,
  };
  return NextResponse.json(response, { status: statusCode });
}

export function errorResponse(message: string, statusCode = 400) {
  const response: ApiResponse = {
    status: "error",
    message,
  };
  return NextResponse.json(response, { status: statusCode });
}
