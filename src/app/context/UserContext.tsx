import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { getUserByEmail } from "@/lib/actions/user.actions";

const UserContext = createContext<any>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    photo: string;
    userBio: string;
  }>({
    firstName: "John",
    lastName: "Doe",
    photo: "/images/user/user-01.png",
    userBio: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user?.email) {
        try {
          const fetchedUser = await getUserByEmail(session.user.email);
          setUser({
            firstName: fetchedUser?.firstName || "John",
            lastName: fetchedUser?.lastName || "Doe",
            photo: fetchedUser?.photo || "/images/user/user-01.png",
            userBio: fetchedUser?.userBio || "",
          });
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
    };
    fetchUser();
  }, [session?.user?.email]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
