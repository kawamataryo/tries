package org.example.html;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.example.dom.Node;

public class Parser {
  int pos;
  String input;

  // 初期化
  public Parser(String input) {
    this.pos = 0;
    this.input = input;
  }

  // 次の文字覗き見する
  public String peekChar() {
    if (this.eof()) {
      throw new IllegalStateException("EOF");
    }
    return this.input.substring(this.pos, this.pos + 1);
  }

  // 指定した文字列で始まるかどうかを返す
  public boolean startsWith(String s) {
    return this.input.startsWith(s, this.pos);
  }

  // 指定した文字列が現在の位置にあるかどうかを確認する
  public void expect(String s) {
    if (!this.startsWith(s)) {
      throw new IllegalStateException("Expected " + s);
    }
    this.pos += s.length();
  }

  // posが入力の末尾に達したかどうかを返す
  public boolean eof() {
    return this.pos >= this.input.length();
  }

  // 次の文字を読み込む
  public String consumeChar() {
    String c = this.peekChar();
    this.pos++;
    return c;
  }

  // 指定した条件を満たすまで、文字列を読み込む
  public String consumeWhile(Function<String, Boolean> predicate) {
    StringBuilder sb = new StringBuilder();
    while (!this.eof() && predicate.apply(this.peekChar())) {
      sb.append(this.consumeChar());
    }
    return sb.toString();
  }

  // 空白文字を読み込む
  public void consumeWhitespace() {
    this.consumeWhile(c -> c.equals(" ") || c.equals("\t") || c.equals("\n") || c.equals("\r"));
  }

  // 名前を読み込む
  public String parseName() {
    return this.consumeWhile(c -> c.matches("[a-zA-Z0-9]"));
  }

  // ノードをパースする
  public Node parseNode() {
    this.consumeWhitespace();
    return switch (this.peekChar()) {
      case "<" -> this.parseElement();
      default -> this.parseText();
    };
  }

  // テキストをパースする
  public Node parseText() {
    return Node.text(this.consumeWhile(c -> !c.equals("<")));
  }

  // elementをパースする
  public Node parseElement() {
    this.expect("<");
    String tagName = this.parseName();
    Map<String, String> attributes = this.parseAttributes();
    this.expect(">");
    List<Node> children = this.parseNodes();
    this.expect("</");
    this.expect(tagName);
    this.expect(">");
    return Node.element(tagName, attributes, children);
  }

  // nodeのattributeをパースする
  public Map<String, String> parseAttributes() {
    this.consumeWhitespace();
    Map<String, String> attributes = new HashMap<String, String>();
    while (!this.peekChar().equals(">")) {
      String name = this.parseName();
      this.expect("=");
      this.expect("\"");
      String value = this.consumeWhile(c -> !c.equals("\""));
      attributes.put(name, value);
      this.expect("\"");
      this.consumeWhitespace();
    }
    return attributes;
  }

  // nodeのリストをパースする
  public List<Node> parseNodes() {
    List<Node> nodes = new ArrayList<Node>();
      
    this.consumeWhitespace();
    while (!this.eof() && !this.startsWith("</")) {
      if (this.startsWith("<")) {
        nodes.add(this.parseElement());
      } else {
        nodes.add(this.parseText());
      }
      this.consumeWhitespace();
    }
    return nodes;
  }
}
