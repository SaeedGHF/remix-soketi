import { type MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4 w-1/5">
        <form method="POST" action="/login">
          <input type="text" name="username" />
          <input type="submit" value="Join" />
        </form>
      </div>
    </div>
  );
}