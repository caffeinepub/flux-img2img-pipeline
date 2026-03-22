import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PipelineItem } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllPipelines() {
  const { actor, isFetching } = useActor();
  return useQuery<PipelineItem[]>({
    queryKey: ["pipelines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPipelines();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePipeline() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      index,
      imageUrl,
      prompt,
    }: {
      index: number;
      imageUrl: string;
      prompt: string;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.updatePipeline(BigInt(index), imageUrl, prompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });
}

export function useAddPipeline() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      imageUrl,
      prompt,
    }: {
      imageUrl: string;
      prompt: string;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.addPipeline(imageUrl, prompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });
}

export function useResetToDefault() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (defaults: PipelineItem[]) => {
      if (!actor) throw new Error("No actor");
      await actor.resetToDefault(defaults);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });
}
