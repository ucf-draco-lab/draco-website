// The paper's printed calcNewTrust (Section 5), copied verbatim except for the
// semicolon missing after "trust += INC_TRUST" in the print. Harness added.
import java.io.*; import java.util.*;
public class PaperTrust {
  private static final int START_TRUST = 3;
  private static final int INC_TRUST = 1;
  private static final int MAX_TRUST = 8;
  private int calcNewTrust(
    int address, int previousAddress,
    int trust)
  {// Duplicate addresses don't change the trust.
    if (previousAddress == address)
    { return trust; }
    // Sequential access increases trust.
    else if (previousAddress+1 == address) {
      trust += INC_TRUST;
      if (trust > MAX_TRUST)
        trust = MAX_TRUST;
      return trust;
    }// Non-sequential access decreases trust.
    else
    { return trust -= INC_TRUST; }
  }
  public static void main(String[] a) throws IOException {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    PaperTrust p = new PaperTrust(); String line; StringBuilder sb = new StringBuilder();
    while ((line = br.readLine()) != null) {
      if (line.isEmpty()) { sb.append("\n"); continue; }
      String[] s = line.trim().split(" "); int trust = START_TRUST; int prev = 0; boolean first = true;
      for (int i = 0; i < s.length; i++) { int x = Integer.parseInt(s[i]);
        if (!first) trust = p.calcNewTrust(x, prev, trust); first = false; prev = x;
        sb.append(trust).append(i + 1 < s.length ? " " : ""); }
      sb.append("\n");
    }
    System.out.print(sb);
  }
}
