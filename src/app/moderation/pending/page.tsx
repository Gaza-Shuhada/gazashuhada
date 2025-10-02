'use client';

function ModerationContent() {
  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pending Moderation</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600">
              The moderation system will be implemented in Phase 5. This page will show:
            </p>
            <ul className="mt-4 text-left max-w-md mx-auto space-y-2 text-gray-600">
              <li>• Pending community submissions</li>
              <li>• Flag reports to review</li>
              <li>• Edit proposals for death-related fields</li>
              <li>• Approve/reject actions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModerationPage() {
  return <ModerationContent />;
}
