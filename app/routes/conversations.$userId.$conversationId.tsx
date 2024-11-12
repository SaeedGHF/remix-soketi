import {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  json,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { prisma } from "~/db.server";
import { pusherClient } from "~/services/soketi.client";
import { pusherServer } from "~/services/soketi.server";

export const loader: LoaderFunction = async ({
  params,
}: LoaderFunctionArgs) => {
  const userId: string | undefined = params.userId;
  const conversationId: string | undefined = params.conversationId;
  if (!userId || !conversationId) {
    throw new Error("Bad Request");
  }

  const user = await prisma.users.findUnique({
    where: {
      id: parseInt(userId),
    },
    include: {
      Participants: {
        include: {
          user: true,
        },
      },
    },
  });

  const messages = await prisma.messages.findMany({
    where: {
      conversationId: parseInt(conversationId),
    },
    include: {
      sender: true,
    },
  });

  return json({
    user,
    conversationId,
    messages,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const body = await request.formData();
  const result = await prisma.messages.create({
    data: {
      conversationId: parseInt(params.conversationId!),
      senderId: parseInt(params.userId!),
      content: body.get("body") as string,
    },
  });

  await pusherServer.trigger(
    params.conversationId!.toString(),
    "evt::new-message",
    result
  );

  return json({ ok: true });
};

type Message = {
  content: string;
  id: number;
  conversationId: number;
  senderId: number;
};

export default function ConversationsLayout() {
  const { user, conversationId, messages } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [body, setBody] = useState("");

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Array<Message>>(() => [...messages]);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  useEffect(() => {
    const channel = pusherClient
      .subscribe(conversationId.toString())
      .bind("evt::new-message", (datum: Message) =>
        setItems((state) => [...state, datum])
      );

    return () => {
      channel.unbind();
    };
  }, []);

  return (
    <div className="h-full flex flex-col justify-end items-end">
      <div className="w-full h-24 flex items-center justify-end border-b-1.5">
        <div className="mx-4">
          <button
            color="primary"
            onClick={(evt) => {
              evt.stopPropagation();
              navigator.clipboard.writeText(
                `http://localhost:5173/invite/${conversationId}`
              );
            }}
          >
            Invite Link
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="h-full w-full flex flex-col overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={clsx([
                "mt-1.5 flex",
                item.senderId === user.id ? "justify-end" : "justify-start",
                items.length - 1 === index && "mb-3",
              ])}
            >
              <div
                className={clsx([
                  "max-w-md rounded-xl p-3",
                  item.senderId === user.id
                    ? "bg-blue-500 text-white rounded-br-none mr-4"
                    : "bg-gray-300 text-gray-800 rounded-bl-none ml-4",
                ])}
              >
                {item.content}
              </div>
            </div>
          ))}
          <div ref={lastMessageRef} />
        </div>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center space-y-1">
          <span className="text-lg leading-relaxed text-gray-500">
            Be the first one to send the first text
          </span>
          <small className="text-gray-400 leading-relaxed">or just wait</small>
        </div>
      )}

      <div className="w-full h-24 border-t-1.5">
        <div className="flex flex-row items-center justify-center space-x-4 h-full w-full">
          <div className="w-4/6">
            <textarea
              name="body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const formData = new FormData();
              formData.append("body", body);
              submit(formData, { method: "post" });
            }}
            color="primary"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
