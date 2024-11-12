import { ActionFunction, ActionFunctionArgs, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const chatId = params.chatId;
  const data = await request.formData();
  const username = data.get("username");

  if (!chatId || typeof username !== "string") {
    throw new Error("An error has occurred.");
  }

  const user = await prisma.users.findUnique({
    where: {
      username: username,
    },
  });

  const userId = user?.id;
  if (!userId) {
    throw new Error("Cannot find user.");
  }

  const result = await prisma.participants.create({
    data: {
      userId: userId,
      conversationId: parseInt(chatId),
    },
  });
  if (!result) {
    throw new Error("This username is already part of the chat");
  }

  return redirect(`/conversations/${userId}/${chatId}`);
};

export default function Invite() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4 w-1/5">
        <h3 className="text-lg leading-relaxed">Invitation link</h3>
        <form method="POST">
          <input type="text" name="username" />
          <input type="submit" value="Join" />
        </form>
      </div>
    </div>
  );
}
