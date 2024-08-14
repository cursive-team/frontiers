export const verifyCmac = async (
  hexData: string
): Promise<string | undefined> => {
  console.log(hexData);

  if (hexData.startsWith("CURSIVE")) {
    const lastTwoChars = hexData.slice(-2);
    const num = parseInt(lastTwoChars, 10);
    if (isNaN(num) || num < 1 || num > 50) return undefined;
    return hexData;
  }

  // Fetch validation from the API
  try {
    const response = await fetch(
      `https://791a-2601-281-8400-15-51e6-e9f5-e153-23a3.ngrok-free.app/api/validate?e=${hexData}`,
      {
        method: "GET",
        headers: {
          Authorization:
            "Bearer 5d5a7266cf9bbb993317c860693fa4e43bfd71e17ae5513d46eeadb0444a1113",
        },
      }
    );
    const data = await response.json();

    if (data.valid === true) {
      return data.tag.uid.toString();
    }
  } catch (error) {
    console.error("Error validating CMAC:", error);
  }

  return undefined;
};
