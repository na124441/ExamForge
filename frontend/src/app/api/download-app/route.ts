import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "mobileconfig") {
    // Direct iOS WebClip MobileConfig Profile (1-tap direct install on Apple iOS devices)
    const mobileConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>ExamForge</string>
            <key>PayloadDescription</key>
            <string>ExamForge Examination Operating System</string>
            <key>PayloadDisplayName</key>
            <string>ExamForge</string>
            <key>PayloadIdentifier</key>
            <string>org.examforge.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>98E2A671-5092-4917-8B39-6B1F9EF4F2A1</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>https://exam-forge-jowdmmskg-na124441s-projects.vercel.app/</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Install ExamForge Examination Infrastructure App</string>
    <key>PayloadDisplayName</key>
    <string>ExamForge App</string>
    <key>PayloadIdentifier</key>
    <string>org.examforge.profile</string>
    <key>PayloadOrganization</key>
    <string>ExamForge Trust Authority</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>F1A07361-9872-4DFB-8234-A78C053B3C89</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

    return new NextResponse(mobileConfigXml, {
      status: 200,
      headers: {
        "Content-Type": "application/x-apple-aspen-config; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ExamForge.mobileconfig"',
      },
    });
  }

  // Default: Direct Desktop / Android Web App Launcher File (.url / shortcut)
  const desktopShortcut = `[InternetShortcut]
URL=https://exam-forge-jowdmmskg-na124441s-projects.vercel.app/
IconIndex=0
IconFile=https://exam-forge-jowdmmskg-na124441s-projects.vercel.app/favicon.ico
HotKey=0
IDList=
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,0
`;

  return new NextResponse(desktopShortcut, {
    status: 200,
    headers: {
      "Content-Type": "application/x-mswinurl; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ExamForge.url"',
    },
  });
}
