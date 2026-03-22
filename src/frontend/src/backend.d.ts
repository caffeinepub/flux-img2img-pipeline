import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PipelineItem {
    imageUrl: string;
    prompt: string;
}
export interface backendInterface {
    addPipeline(imageUrl: string, prompt: string): Promise<void>;
    getAllPipelines(): Promise<Array<PipelineItem>>;
    resetToDefault(defaultPipelines: Array<PipelineItem>): Promise<void>;
    updatePipeline(index: bigint, imageUrl: string, prompt: string): Promise<void>;
}
