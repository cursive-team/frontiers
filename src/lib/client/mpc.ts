import { JobCandidateInput } from "@/components/jobs/CandidatePage";
import { JobRecruiterInput } from "@/components/jobs/RecruiterPage";
import init, {
  ni_hiring_init_web,
  ni_hiring_client_setup_web,
  ni_hiring_client_encrypt_web,
} from "@/lib/ni_hiring_web";
import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";

export const mpcBlobUploadClient = async (
  name: string,
  data: Uint8Array | string | File
) => {
  const newBlob: PutBlobResult = await upload(name, data, {
    access: "public",
    handleUploadUrl: "/api/mpcBlobUploadServer",
  });

  return newBlob.url;
};

export const serializeMPCData = (data: any) => {
  return JSON.stringify(data, (key, value) => {
    if (typeof value === "bigint") {
      return value.toString() + "n";
    }
    if (value instanceof Map) {
      return {
        dataType: "Map",
        value: Array.from(value.entries()).map(([k, v]) => [
          typeof k === "bigint" ? k.toString() + "n" : k,
          v,
        ]),
      };
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === "bigint") {
          return item.toString() + "n";
        }
        return item;
      });
    }
    return value;
  });
};

export const deserializeMPCData = (data: string) => {
  return JSON.parse(data, (key, value) => {
    if (typeof value === "string" && /^\d+n$/.test(value)) {
      return BigInt(value.slice(0, -1));
    }
    if (value && typeof value === "object" && value.dataType === "Map") {
      return new Map(
        value.value.map(([k, v]: [any, any]) => [
          typeof k === "string" && /^\d+n$/.test(k)
            ? BigInt(k.slice(0, -1))
            : k,
          Array.isArray(v)
            ? v.map((item) =>
                typeof item === "string" && /^\d+n$/.test(item)
                  ? BigInt(item.slice(0, -1))
                  : item
              )
            : v,
        ])
      );
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === "string" && /^\d+n$/.test(item)) {
          return BigInt(item.slice(0, -1));
        }
        return item;
      });
    }
    return value;
  });
};

export const generateMPCKeys = async (id: number) => {
  await init();

  // need to do this at least once, but other attempts will
  // break. this is a hacky way of avoiding storing state on
  // if we've done this already.
  try {
    ni_hiring_init_web(BigInt(1));
  } catch (e) {}

  const gen_keys_output = ni_hiring_client_setup_web(id, 2);

  return {
    mpcPrivateKey: gen_keys_output.client_key,
    mpcPublicKey: gen_keys_output.server_key_share,
  };
};

export const generateMPCCandidateEncryption = (
  mpcPrivateKey: any,
  input: JobCandidateInput
) => {
  const boolArray = [
    input.education >= 0,
    input.education >= 1,
    input.education >= 2,
    input.education >= 3,
    input.experience >= 1,
    input.experience >= 2,
    input.experience >= 3,
    input.experience >= 4,
    input.experience >= 5,
    input.experience >= 6,
    input.experience >= 7,
    input.experience >= 8,
    input.interestZk,
    input.interestDefi,
    input.interestConsumer,
    input.interestInfra,
    input.stageParadigm,
    input.stageGrant,
    input.stageSeed,
    input.stageSeriesA,
  ];

  console.log(input);
  console.log("candidate", boolArray);
  console.log(Math.round(input.salary / 3));

  return ni_hiring_client_encrypt_web(
    mpcPrivateKey,
    false,
    input.partTime,
    new Uint8Array(boolArray.map((b) => (b ? 1 : 0))),
    Math.round(input.salary / 3)
  );
};

export const generateMPCRecruiterEncryption = (
  mpcPrivateKey: any,
  input: JobRecruiterInput
) => {
  const boolArray = [
    input.education <= 0,
    input.education <= 1,
    input.education <= 2,
    input.education <= 3,
    input.experience <= 1,
    input.experience <= 2,
    input.experience <= 3,
    input.experience <= 4,
    input.experience <= 5,
    input.experience <= 6,
    input.experience <= 7,
    input.experience <= 8,
    input.tagZk,
    input.tagDefi,
    input.tagConsumer,
    input.tagInfra,
    input.stageParadigm,
    input.stageGrant,
    input.stageSeed,
    input.stageSeriesA,
  ];

  console.log(input);
  console.log("candidate", boolArray);
  console.log(Math.round(input.salary / 3));

  return ni_hiring_client_encrypt_web(
    mpcPrivateKey,
    true,
    input.partTime,
    new Uint8Array(boolArray.map((b) => (b ? 1 : 0))),
    Math.round(input.salary / 3)
  );
};
