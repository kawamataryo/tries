package org.example.html;

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
  public String next_char() throws Exception {
    if (this.eof()) {
      throw new Exception("EOF");
    }
    return this.input.substring(this.pos, this.pos + 1);
  }

  // 指定した文字列で始まるかどうかを返す
  public boolean starts_with(String s) {
    return this.input.startsWith(s, this.pos);
  }

  // 指定した文字列が現在の位置にあるかどうかを確認する
  public void expect(String s) throws Exception {
    if (!this.starts_with(s)) {
      throw new Exception("Expected " + s);
    }
    this.pos += s.length();
  }

  // posが入力の末尾に達したかどうかを返す
  public boolean eof() {
    return this.pos >= this.input.length();
  }

  // 次の文字を読み込む
  public String consume_char() throws Exception {
    String c = this.next_char();
    this.pos++;
    return c;
  }

  // 指定した条件を満たすまで、文字列を読み込む
  public String consume_while(Function<String, Boolean> predicate) throws Exception {
    StringBuilder sb = new StringBuilder();
    while (!this.eof() && predicate.apply(this.next_char())) {
      sb.append(this.consume_char());
    }
    return sb.toString();
  }

  // 空白文字を読み込む
  public void consume_whitespace() throws Exception {
    this.consume_while(c -> c.equals(" ") || c.equals("\t") || c.equals("\n") || c.equals("\r"));
  }

  // 名前を読み込む
  public String parse_name() throws Exception {
    return this.consume_while(c -> c.matches("[a-zA-Z0-9]"));
  }

  // ノードをパースする
  public Node parse_node() throws Exception {
    this.consume_whitespace();
    if (this.starts_with("<")) {
      return this.parse_element();
    }
    return this.parse_text();
  }

  // テキストをパースする
  public Node parse_text() throws Exception {
    return Node.text(this.consume_while(c -> c != "<"));
  }

  // elementをパースする
  public Node parse_element() throws Exception {
    this.expect("<");
    String tag_name = this.parse_name();
    Map<String, String> attributes = this.parse_attributes();
    this.expect(">");
    List<Node> children = this.parse_nodes();
    this.expect("</");
    this.expect(tag_name);
    this.expect(">");
  }
}
