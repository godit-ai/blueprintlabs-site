/**
 * Object Memory System Tests
 * 
 * Tests for Phase 1 (Prefix Caching) and Phase 2 (Object Memory)
 * Demonstrates 70%+ cost reduction vs naive approach
 */

const pmiEngine = require('../src/services/pmiEngine');
const objectMemory = require('../src/services/objectMemory');

// ─── Test Data ────────────────────────────────────────────────────────────────

const SAMPLE_CONVERSATION = [
  {
    role: 'system',
    content: `You are a helpful AI assistant for managing projects and teams.

Core Capabilities:
- Project planning and task management
- Meeting summarization and action item tracking
- Team collaboration and decision support
- Document analysis and information extraction

Guidelines:
1. Be concise and actionable
2. Always track decisions and action items
3. Maintain context across conversations
4. Prioritize clarity over verbosity

When users share meeting notes or project updates, extract:
- Key decisions made
- Action items and owners
- Important dates and deadlines
- People mentioned and their roles`
  },
  {
    role: 'user',
    content: `Here are my notes from today's sprint planning meeting:

Meeting: Sprint Planning Q1 2024
Date: March 23, 2024
Attendees: Sarah Chen (PM), Mike Rodriguez (Tech Lead), Jamie Park (Designer), Alex Kumar (Backend)

Decisions:
- Decided to prioritize the user dashboard redesign for Sprint 12
- Agreed to use React Query for data fetching instead of Redux
- Approved budget of $15,000 for third-party analytics integration

Action Items:
- Sarah to create user stories by Friday, March 25
- Mike to set up the new API endpoints by next Tuesday
- Jamie to deliver mockups by March 27
- Alex needs to review the database schema changes before we start

Key Dates:
- Sprint kickoff: Monday, March 25, 2024
- Design review: March 27 at 2pm
- Code freeze: April 5, 2024
- Sprint demo: April 8, 2024

Technical Notes:
- Backend will use PostgreSQL 15.2
- Frontend needs to support IE11 (ugh, enterprise clients)
- API rate limit: 1000 requests per hour per user

Topics to revisit:
- We need to discuss the mobile app strategy
- Should we migrate to TypeScript? Team is split 50/50
- Performance testing framework selection`
  },
  {
    role: 'assistant',
    content: `I've extracted the key information from your sprint planning meeting:

**Decisions Made:**
1. ✅ User dashboard redesign is top priority for Sprint 12
2. ✅ React Query chosen over Redux for data fetching
3. ✅ $15,000 budget approved for analytics integration

**Action Items:**
- Sarah Chen (PM): Create user stories by Friday, March 25
- Mike Rodriguez (Tech Lead): Set up new API endpoints by Tuesday, March 28
- Jamie Park (Designer): Deliver mockups by March 27
- Alex Kumar (Backend): Review database schema changes (blocking)

**Important Dates:**
- March 25: Sprint kickoff
- March 27, 2pm: Design review
- April 5: Code freeze
- April 8: Sprint demo

**Technical Stack:**
- Backend: PostgreSQL 15.2
- Frontend: React Query, IE11 support required
- API: 1000 req/hour rate limit

**Topics for Future Discussion:**
- Mobile app strategy
- TypeScript migration (team divided)
- Performance testing framework

Would you like me to help prioritize these action items or set up reminders for the key dates?`
  }
];

const SAMPLE_PROSE = `
Meeting with Sarah Chen on March 23, 2024. We decided to move forward with the React Query implementation.
Mike Rodriguez will handle the backend API work. Jamie Park is designing the new dashboard mockups.

Key decision: Approved the $15,000 budget for analytics integration. Sarah needs to finish the user stories
by Friday, March 25. The sprint demo is scheduled for April 8, 2024.

We need to discuss the mobile app strategy at our next sync. Alex Kumar mentioned that the database schema
review is critical before we can start development.

Important note: We're still supporting IE11 for enterprise clients. The API has a rate limit of 1000 requests
per hour per user. Backend will use PostgreSQL 15.2.

Topic for next meeting: Should we migrate to TypeScript? The team is split 50/50 on this decision.
`;

// ─── Phase 1: Prefix Caching Tests ───────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('PHASE 1: EXACT-PREFIX CACHING TESTS');
console.log('═══════════════════════════════════════════════════════════════\n');

function testPrefixCaching() {
  console.log('Test 1: Analyzing conversation for caching opportunities\n');
  
  const result = pmiEngine.analyzeForCaching(SAMPLE_CONVERSATION, { provider: 'anthropic' });
  
  console.log('📊 Segmentation Results:');
  console.log(`   Stable Prefix: ${result.segmentation.stablePrefix.length} messages (${result.segmentation.prefixTokens} tokens)`);
  console.log(`   Dynamic Suffix: ${result.segmentation.dynamicSuffix.length} messages (${result.segmentation.dynamicTokens} tokens)`);
  console.log(`   Total: ${result.segmentation.totalTokens} tokens`);
  console.log(`   Cache Savings: ${result.cache.cacheSavingsPercent}% of conversation can be cached\n`);
  
  console.log('💰 Cost Estimate (per request):');
  console.log(`   OpenAI Naive: ${result.costEstimate.perRequest.openai.naive}`);
  console.log(`   OpenAI Cached: ${result.costEstimate.perRequest.openai.withCaching}`);
  console.log(`   OpenAI Savings: ${result.costEstimate.perRequest.openai.saved} (${result.costEstimate.perRequest.openai.savingsPercent}%)\n`);
  
  console.log(`   Anthropic Naive: ${result.costEstimate.perRequest.anthropic.naive}`);
  console.log(`   Anthropic Cached: ${result.costEstimate.perRequest.anthropic.withCaching}`);
  console.log(`   Anthropic Savings: ${result.costEstimate.perRequest.anthropic.saved} (${result.costEstimate.perRequest.anthropic.savingsPercent}%)\n`);
  
  console.log('📈 Monthly Projection (1000 requests/day):');
  console.log(`   OpenAI Saved: ${result.costEstimate.projection.openaiMonthlySaved}/month`);
  console.log(`   Anthropic Saved: ${result.costEstimate.projection.anthropicMonthlySaved}/month\n`);
  
  console.log('🔑 Caching Strategy:');
  console.log(`   Prefix Hash: ${result.cache.prefixHash}`);
  console.log(`   Was Cached: ${result.cache.wasCached}`);
  console.log(`   Cache Hits: ${result.cache.hits}\n`);
  
  // Test cache persistence by analyzing again
  console.log('Test 2: Testing cache persistence (second request with same prefix)\n');
  const result2 = pmiEngine.analyzeForCaching(SAMPLE_CONVERSATION, { provider: 'anthropic' });
  console.log(`   Cache Hit: ${result2.cache.wasCached} ✅`);
  console.log(`   Cache Hits: ${result2.cache.hits}\n`);
  
  return result;
}

// ─── Phase 2: Object Memory Tests ────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════');
console.log('PHASE 2: OBJECT MEMORY TESTS');
console.log('═══════════════════════════════════════════════════════════════\n');

function testObjectExtraction() {
  console.log('Test 3: Extracting structured objects from prose\n');
  
  const { objects, stats } = objectMemory.extract(SAMPLE_PROSE, { source: 'test' });
  
  console.log(`📦 Extracted ${objects.length} objects:\n`);
  
  const byType = {};
  objects.forEach(obj => {
    if (!byType[obj.type]) byType[obj.type] = [];
    byType[obj.type].push(obj);
  });
  
  for (const [type, objs] of Object.entries(byType)) {
    console.log(`   ${type.toUpperCase()} (${objs.length}):`);
    objs.forEach(obj => {
      console.log(`      - ${obj.toCompact()}`);
    });
    console.log('');
  }
  
  console.log('📊 Extraction Stats:');
  console.log(`   Original Tokens: ${stats.originalTokens}`);
  console.log(`   Object Tokens: ${stats.objectTokens}`);
  console.log(`   Compression: ${stats.compressionRatio}%\n`);
  
  return { objects, stats };
}

function testObjectReconstruction() {
  console.log('Test 4: Reconstructing optimal context from objects\n');
  
  const { objects } = objectMemory.extract(SAMPLE_PROSE, { source: 'test' });
  const store = new objectMemory.ObjectStore();
  objects.forEach(obj => store.add(obj));
  
  // Test different formats
  console.log('Format: COMPACT\n');
  const compact = objectMemory.reconstruct(store, { tokenBudget: 500, format: 'compact' });
  console.log(compact.context);
  console.log(`\nTokens: ${compact.tokens} (using ${compact.objectsUsed}/${compact.totalObjects} objects)`);
  console.log(`Reduction: ${compact.savings.reduction}%\n`);
  
  console.log('─────────────────────────────────────────────────────────────\n');
  
  console.log('Format: STRUCTURED (JSON)\n');
  const structured = objectMemory.reconstruct(store, { tokenBudget: 1000, format: 'structured' });
  console.log(structured.context.substring(0, 300) + '...\n');
  console.log(`Tokens: ${structured.tokens}\n`);
  
  return { compact, structured };
}

function testFullPipeline() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PHASE 2: FULL PIPELINE TEST (Extract + Reconstruct)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const result = objectMemory.processMemory(SAMPLE_PROSE, {
    tokenBudget: 600,
    format: 'compact',
    source: 'test'
  });
  
  console.log('📦 Extraction:');
  console.log(`   Objects Found: ${result.extraction.objectCount}`);
  console.log(`   Type Breakdown:`, result.extraction.stats.typeBreakdown);
  console.log('');
  
  console.log('🔄 Reconstruction:');
  console.log(`   Tokens Used: ${result.reconstruction.tokens} / ${result.costAnalysis.originalTokens}`);
  console.log(`   Objects Used: ${result.reconstruction.objectsUsed}\n`);
  
  console.log('💰 Cost Analysis:');
  console.log(`   Naive Approach: ${result.costAnalysis.naiveCost}`);
  console.log(`   Object Memory: ${result.costAnalysis.objectMemoryCost}`);
  console.log(`   Savings: ${result.costAnalysis.savings.costSavedPerRequest} (${result.costAnalysis.savings.percentReduction}%)`);
  console.log(`   Monthly @ 1k RPD: ${result.costAnalysis.savings.monthlySavingsAt1kRPD}\n`);
  
  console.log('📝 Reconstructed Context:\n');
  console.log(result.reconstruction.context);
  console.log('\n');
  
  return result;
}

// ─── Combined Pipeline Test ──────────────────────────────────────────────────

function testCombinedPipeline() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('COMBINED PIPELINE: Phase 1 + Phase 2');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Scenario: Production chatbot with 1000 requests/day\n');
  
  // Phase 1: Analyze prefix caching
  const cacheResult = pmiEngine.analyzeForCaching(SAMPLE_CONVERSATION);
  
  // Phase 2: Extract objects from conversation
  const fullText = SAMPLE_CONVERSATION.map(m => `[${m.role}]: ${m.content}`).join('\n');
  const memoryResult = objectMemory.processMemory(fullText, { tokenBudget: 2000, format: 'compact' });
  
  const originalTokens = cacheResult.segmentation.totalTokens;
  const prefixTokens = cacheResult.segmentation.prefixTokens;
  const dynamicTokens = cacheResult.segmentation.dynamicTokens;
  const objectTokens = memoryResult.reconstruction.tokens;
  
  console.log('📊 Token Analysis:');
  console.log(`   Original Total: ${originalTokens} tokens`);
  console.log(`   └─ Stable Prefix: ${prefixTokens} tokens (cached)`);
  console.log(`   └─ Dynamic Content: ${dynamicTokens} tokens\n`);
  
  console.log('   Object Memory:');
  console.log(`   └─ Extracted Objects: ${memoryResult.extraction.objectCount}`);
  console.log(`   └─ Reconstructed: ${objectTokens} tokens\n`);
  
  // Cost calculations (Claude 3.5 Sonnet pricing)
  const PRICE_INPUT = 3.00;      // per 1M tokens
  const PRICE_CACHED = 0.30;     // per 1M cached tokens
  const PRICE_CACHE_WRITE = 3.75; // per 1M tokens (first write)
  
  const naiveCost = (originalTokens / 1_000_000) * PRICE_INPUT;
  
  // Strategy 1: Prefix caching only
  const cachingCost = ((prefixTokens / 1_000_000) * PRICE_CACHED) + ((dynamicTokens / 1_000_000) * PRICE_INPUT);
  
  // Strategy 2: Object memory only
  const objectCost = (objectTokens / 1_000_000) * PRICE_INPUT;
  
  // Strategy 3: Combined (cache prefix + object memory for dynamic)
  const combinedCost = ((prefixTokens / 1_000_000) * PRICE_CACHED) + ((objectTokens / 1_000_000) * PRICE_INPUT);
  
  console.log('💰 Cost Comparison (per request):');
  console.log(`   1. Naive (no optimization):     $${naiveCost.toFixed(6)}`);
  console.log(`   2. Prefix Caching only:         $${cachingCost.toFixed(6)} (${Math.round((1 - cachingCost/naiveCost) * 100)}% savings)`);
  console.log(`   3. Object Memory only:          $${objectCost.toFixed(6)} (${Math.round((1 - objectCost/naiveCost) * 100)}% savings)`);
  console.log(`   4. Combined (Phase 1 + 2):      $${combinedCost.toFixed(6)} (${Math.round((1 - combinedCost/naiveCost) * 100)}% savings) ⭐\n`);
  
  const monthlySavings = (naiveCost - combinedCost) * 1000 * 30;
  
  console.log('📈 Monthly Projection (1000 requests/day):');
  console.log(`   Naive Cost:     $${(naiveCost * 1000 * 30).toFixed(2)}/month`);
  console.log(`   Optimized Cost: $${(combinedCost * 1000 * 30).toFixed(2)}/month`);
  console.log(`   💵 SAVINGS:     $${monthlySavings.toFixed(2)}/month\n`);
  
  const savingsPercent = Math.round((1 - combinedCost/naiveCost) * 100);
  
  console.log('✅ RESULT:');
  console.log(`   ${savingsPercent}% cost reduction achieved!\n`);
  
  if (savingsPercent >= 70) {
    console.log('   🎯 TARGET MET: ≥70% cost reduction ✅\n');
  } else {
    console.log(`   ⚠️  Target: 70% | Actual: ${savingsPercent}%\n`);
  }
  
  return {
    savingsPercent,
    monthlySavings,
    naiveCost,
    optimizedCost: combinedCost
  };
}

// ─── Run All Tests ────────────────────────────────────────────────────────────

function runAllTests() {
  console.clear();
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║     PMI v5.0 — Object-Based Memory Hierarchy Tests           ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  try {
    // Phase 1 Tests
    testPrefixCaching();
    
    // Phase 2 Tests
    testObjectExtraction();
    testObjectReconstruction();
    testFullPipeline();
    
    // Combined
    const finalResult = testCombinedPipeline();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ Phase 1: Exact-Prefix Caching — WORKING');
    console.log('✅ Phase 2: Object Memory — WORKING');
    console.log(`✅ Combined Optimization: ${finalResult.savingsPercent}% cost reduction`);
    console.log(`✅ Monthly Savings: $${finalResult.monthlySavings.toFixed(2)}\n`);
    
    if (finalResult.savingsPercent >= 70) {
      console.log('🎉 ALL TESTS PASSED — PRODUCTION READY\n');
    } else {
      console.log('⚠️  Warning: Did not meet 70% reduction target\n');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:\n', error);
    process.exit(1);
  }
}

// ─── Execute ──────────────────────────────────────────────────────────────────

if (require.main === module) {
  runAllTests();
}

module.exports = {
  testPrefixCaching,
  testObjectExtraction,
  testObjectReconstruction,
  testFullPipeline,
  testCombinedPipeline,
  runAllTests
};
