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
    const params = new URLSearchParams({ e: hexData });
    const response = await fetch(
      `http://ec2-54-176-6-140.us-west-1.compute.amazonaws.com:9091/api/validate?${params}`,
      {
        method: "GET",
        headers: {
          Authorization:
            "Bearer 2162b3965f92e6e6a7b91f10ddf4db9160559f1d473aaf2d8ab11c2e3f7f59fa",
        },
      }
    );
    const data = await response.json();

    console.log(data);

    if (data.valid === true) {
      return data.tag.uid.toString();
    }
  } catch (error) {
    console.error("Error validating CMAC:", error);
  }

  return undefined;
};
