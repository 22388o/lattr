import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.185.0/testing/asserts.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.185.0/testing/bdd.ts";
import { Event, generatePrivateKey, nip10, relayInit } from "npm:nostr-tools";
import { createEvent, createReplyEvent, EventTemplateInit } from "./event.ts";
import { PrivateKey } from "./keys.ts";

const privateKey = generatePrivateKey() as PrivateKey;
const privateKey_someone = generatePrivateKey() as PrivateKey;
const relay = relayInit("wss://example.com");

describe("createReplyEvent", () => {
  const root_id = "xxxxxx";
  const reply_id = "yyyyyy";

  let event: Event;
  let template: EventTemplateInit;
  let reply: Event;
  let tags: nip10.NIP10Result;

  beforeEach(() => {
    template = {
      kind: 1,
      content: "hello",
    };
  });

  describe("a reply to a non-reply event", () => {
    beforeEach(() => {
      event = createEvent(privateKey_someone, {
        kind: 1,
        tags: [],
        created_at: 123,
        content: "hello",
      });
      reply = createReplyEvent({ event, relay, template, privateKey });
      tags = nip10.parse(reply);
    });

    it("does not include a reply tags", () => {
      assertEquals(tags.reply, undefined);
    });

    it("has a root tag pointing to the non-reply event", () => {
      assert(tags.root);
      assertEquals(tags.root.id, event.id);
    });
  });

  describe("a reply to a reply-to-non-reply event in a deprecated style", () => {
    beforeEach(() => {
      event = createEvent(privateKey_someone, {
        kind: 1,
        tags: [
          ["e", root_id],
        ],
        created_at: 123,
        content: "hello",
      });
      reply = createReplyEvent({ event, relay, template, privateKey });
      tags = nip10.parse(reply);
    });

    it("has a root tag pointing to the non-reply event", () => {
      assert(tags.root);
      assertEquals(tags.root.id, root_id);
    });

    it("has a reply tag pointing to the reply event", () => {
      assert(tags.reply);
      assertEquals(tags.reply.id, event.id);
    });
  });

  describe("a reply to a reply-to-reply event in a deprecated style", () => {
    beforeEach(() => {
      event = createEvent(privateKey_someone, {
        kind: 1,
        tags: [
          ["e", root_id],
          ["e", reply_id],
        ],
        created_at: 123,
        content: "hello",
      });
      reply = createReplyEvent({ event, relay, template, privateKey });
      tags = nip10.parse(reply);
    });

    it("has a root tag pointing to the root event", () => {
      assert(tags.root);
      assertEquals(tags.root.id, root_id);
    });

    it("has a reply tag pointing to the reply event", () => {
      assert(tags.reply);
      assertEquals(tags.reply.id, event.id);
    });
  });

  describe("a reply to a reply-to-non-reply event in a preferred style", () => {
    beforeEach(() => {
      event = createEvent(privateKey_someone, {
        kind: 1,
        tags: [
          ["e", root_id, relay.url, "root"],
        ],
        created_at: 123,
        content: "hello",
      });
      reply = createReplyEvent({ event, relay, template, privateKey });
      tags = nip10.parse(reply);
    });

    it("has a root tag pointing to the non-reply event", () => {
      assert(tags.root);
      assertEquals(tags.root.id, root_id);
    });

    it("has a reply tag pointing to the reply event", () => {
      assert(tags.reply);
      assertEquals(tags.reply.id, event.id);
    });
  });

  describe("a reply to a reply-to-reply event in a preferred style", () => {
    beforeEach(() => {
      event = createEvent(privateKey_someone, {
        kind: 1,
        tags: [
          ["e", root_id, relay.url, "root"],
          ["e", reply_id, relay.url, "reply"],
        ],
        created_at: 123,
        content: "hello",
      });
      reply = createReplyEvent({ event, relay, template, privateKey });
      tags = nip10.parse(reply);
    });

    it("has a root tag pointing to the non-reply event", () => {
      assert(tags.root);
      assertEquals(tags.root.id, root_id);
    });

    it("has a reply tag pointing to the reply event", () => {
      assert(tags.reply);
      assertEquals(tags.reply.id, event.id);
    });
  });
});
