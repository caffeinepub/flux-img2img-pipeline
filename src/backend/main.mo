import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

actor {
  type PipelineItem = {
    imageUrl : Text;
    prompt : Text;
  };

  var pipelines : [PipelineItem] = [];

  public shared ({ caller }) func addPipeline(imageUrl : Text, prompt : Text) : async () {
    let newItem : PipelineItem = {
      imageUrl;
      prompt;
    };
    pipelines := pipelines.concat([newItem]);
  };

  public query ({ caller }) func getAllPipelines() : async [PipelineItem] {
    pipelines;
  };

  public shared ({ caller }) func updatePipeline(index : Nat, imageUrl : Text, prompt : Text) : async () {
    if (index >= pipelines.size()) {
      Runtime.trap("Index out of bounds");
    };
    let newItem : PipelineItem = {
      imageUrl;
      prompt;
    };
    pipelines := Array.tabulate(
      pipelines.size(),
      func(i) { if (i == index) { newItem } else { pipelines[i] } },
    );
  };

  public shared ({ caller }) func resetToDefault(defaultPipelines : [PipelineItem]) : async () {
    pipelines := defaultPipelines;
  };
};
