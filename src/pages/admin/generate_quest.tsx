import { useState, FormEvent, ChangeEvent } from "react";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { toast } from "sonner";

export default function GenerateQuest() {
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleKeygen = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/admin/generate_quest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Quests generated successfully!");
      setLoading(false);
      setPassword("");
    } catch (error) {
      console.error("Failed to generate key:", error);
      toast.error("Failed to generate key. Please try again.");
      setLoading(false);
      setPassword("");
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  return (
    <FormStepLayout
      className="pt-4 px-4"
      title="Generate quest"
      onSubmit={handleKeygen}
    >
      <Input
        type="password"
        name="password"
        value={password}
        placeholder="Password"
        onChange={handleInputChange}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Running quest gen..." : "Run quest gen"}
      </Button>
    </FormStepLayout>
  );
}

GenerateQuest.getInitialProps = () => {
  return { fullPage: true };
};
