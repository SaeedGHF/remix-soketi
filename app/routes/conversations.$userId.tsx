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
  useOutlet,
  useSubmit,
} from "@remix-run/react";
import { prisma } from "~/db.server";

export const loader: LoaderFunction = async ({
  params,
}: LoaderFunctionArgs) => {
  const userId: string | undefined = params.userId;
  if (!userId) {
    throw new Error("");
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

  return json({
    user,
  });
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const body = await request.formData();

  const userId: string | null = body.get("user") as string;
  const action = body.get("action");

  if (!userId || !action) {
    throw new Error("Bad request");
  }

  if (action === "new-conversation") {
    const user = await prisma.users.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    // Create a new conversation
    const conversation = await prisma.conversations.create({
      data: {
        name: "New Conversation", // You can replace this with a dynamic name if needed
      },
    });
    const conversationId = conversation.id;

    // Add the user as a participant to the new conversation
    await prisma.participants.create({
      data: {
        userId: parseInt(userId),
        conversationId: conversationId,
      },
    });

    return redirect(`/conversations/${userId}/${conversationId}`);
  }

  return json({
    ok: false,
    message: "Action not found",
  });
};

export default function ConversationsLayout() {
  const { user } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const outlet = useOutlet();

  return (
    <div className="h-screen w-screen flex">
      <div className="w-2/6 h-full flex flex-col items-center justify-center space-y-4 border-r-1.5">
        <div className="w-[90%]">
          <button
            type="button"
            color="primary"
            onClick={() => {
              const formData = new FormData();
              formData.append("user", user.id);
              formData.append("action", "new-conversation");
              submit(formData, { method: "post" });
            }}
          >
            New Conversation
          </button>
        </div>
        <div className="bg-white w-[90%] h-5/6 p-2 flex flex-col space-y-4">
          {user?.Participants.map((item: any) => (
            <Link
              key={item.conversationId}
              to={`/conversations/${user.id}/${item.conversationId}`}
              className="h-16 w-full flex items-center justify-start border-1.5"
            >
              <span className="mx-4 truncate">{item.conversationId}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="w-4/6 h-full">
        {outlet || (
          <div className="h-full w-full flex flex-col items-center justify-center space-y-1">
            <span className="text-lg leading-relaxed">
              Select a conversation
            </span>
            <small className="text-gray-400 leading-relaxed">
              or create a new one
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
