import { describe, expect, it } from "vitest";
import RootLayout from "./layout";

describe("root layout", () => {
  it("sets the document language and renders the supplied app tree", () => {
    const layout = RootLayout({ children: <main>Test application</main> });
    expect(layout.type).toBe("html");
    expect(layout.props.lang).toBe("en");
    expect(layout.props.children.type).toBe("body");
  });
});
